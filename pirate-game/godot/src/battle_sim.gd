## Deterministic battle simulation. Pure data in, pure data out — no nodes,
## no rendering, no input. The view layer reads state and calls order_*().
## Ticks at a fixed 10 Hz (Defs.TICK); pausing is simply not ticking.
class_name BattleSim

const D := preload("res://src/defs.gd")

var rng := RandomNumberGenerator.new()

var player: Dictionary
var enemy: Dictionary
var battle: Dictionary

var _ai_timer := 0.0
var _melee_timer := 0.0
var _grapple_timer := 0.0
var _swivel_timers := {"player": 0.0, "enemy": 0.0}


func _init(player_def: Dictionary, enemy_def: Dictionary, seed_value := -1) -> void:
	if seed_value >= 0:
		rng.seed = seed_value
	else:
		rng.randomize()
	player = _init_ship(player_def)
	enemy = _init_ship(enemy_def)
	battle = {
		"time": 0.0,
		"range_pos": 0.5,       # 0..1 Long, 1..2 Medium, 2..3 Close
		"gage": 0.5,            # 0 = enemy owns the wind, 1 = player owns it
		"grappled": false,
		"boarding_side": "",   # "player" / "enemy" while a boarding action runs
		"over": false,
		"outcome": "",
		"summary": "",
		"log": [],
	}
	log_msg("You sight the %s. Beat to quarters!" % enemy["name"])


func _init_ship(def: Dictionary) -> Dictionary:
	var ship: Dictionary = def.duplicate(true)
	ship["stance"] = "hold"
	ship["fires"] = {"weather": 0.0, "gun": 0.0, "hold": 0.0}
	ship["water"] = 0.0
	ship["breaches"] = 0
	ship["breach_repair"] = 0.0
	ship["furnace_intent"] = false
	ship["furnace_heat"] = 0.0
	ship["furnace_lit"] = false
	ship["magazine_heat"] = 0.0
	ship["grapple_intent"] = false
	ship["cut_intent"] = false
	ship["cut_progress"] = 0.0
	ship["escape_progress"] = 0.0
	ship["target_station"] = ""
	ship["dismasted_logged"] = false
	ship["destroyed"] = false
	var idx := 0
	for c in ship["crew"]:
		c["id"] = "%s_%d" % [ship["side"], idx]
		idx += 1
		var post: String = ship["start_posts"].get(c["name"], "")
		if post != "":
			c["station"] = post
	return ship


# ---------------------------------------------------------------- queries ---

func ship_for(side: String) -> Dictionary:
	return player if side == "player" else enemy


func foe_of(ship: Dictionary) -> Dictionary:
	return enemy if ship["side"] == "player" else player


func band() -> int:
	if battle["grappled"]:
		return 3
	return clampi(int(battle["range_pos"]), 0, 2)


func band_name() -> String:
	return D.BAND_NAMES[band()]


func gage_owner() -> String:
	if battle["gage"] > 0.62:
		return "player"
	if battle["gage"] < 0.38:
		return "enemy"
	return ""


func sail_frac(ship: Dictionary) -> float:
	return clampf(ship["sails"] / ship["sails_max"], 0.0, 1.0)


func deck_flooded(ship: Dictionary, deck: String) -> bool:
	match deck:
		"hold":
			return ship["water"] >= 0.9
		"gun":
			return ship["water"] >= 1.9
	return ship["water"] >= 2.9


func station_flooded(ship: Dictionary, st_id: String) -> bool:
	var st: Dictionary = ship["stations"][st_id]
	if st["kind"] == "pumps":
		return ship["water"] >= 1.6  # pumps are built to work half-submerged
	return deck_flooded(ship, st["deck"])


func crew_at(ship: Dictionary, st_id: String) -> Array:
	var out := []
	for c in ship["crew"]:
		if c["alive"] and c["aboard"] == "own" and c["station"] == st_id:
			out.append(c)
	return out


func idle_crew(ship: Dictionary) -> Array:
	return crew_at(ship, "")


func boarders_of(ship: Dictionary) -> Array:
	var out := []
	for c in ship["crew"]:
		if c["alive"] and c["aboard"] == "foe":
			out.append(c)
	return out


func alive_crew(ship: Dictionary) -> Array:
	var out := []
	for c in ship["crew"]:
		if c["alive"]:
			out.append(c)
	return out


## Combined effectiveness of the crew manning a station (0 if wrecked/flooded).
func station_eff(ship: Dictionary, st_id: String) -> float:
	if not ship["stations"].has(st_id):
		return 0.0
	var st: Dictionary = ship["stations"][st_id]
	if st["hp"] <= 0.0 or station_flooded(ship, st_id):
		return 0.0
	var eff := 0.0
	for c in crew_at(ship, st_id):
		var bonus := 0.5 if st["kind"] in D.ROLE_STATION.get(c["role"], []) else 0.0
		eff += 1.0 + bonus
	return eff


## How well the ship maneuvers right now: sails x helm crew x hull state.
func mobility(ship: Dictionary) -> float:
	if ship["destroyed"]:
		return 0.0
	var helm := clampf(station_eff(ship, "helm"), 0.0, 2.0)
	return ship["speed"] * (0.2 + 0.8 * sail_frac(ship)) * (0.55 + 0.45 * helm / 2.0)


func evasion(ship: Dictionary) -> float:
	var ev := 0.32 * sail_frac(ship) * clampf(station_eff(ship, "helm"), 0.0, 1.5) / 1.5
	if gage_owner() == ship["side"]:
		ev += 0.1
	return ev


func log_msg(msg: String) -> void:
	battle["log"].append("%3d:%02d  %s" % [int(battle["time"]) / 60, int(battle["time"]) % 60, msg])
	if battle["log"].size() > 60:
		battle["log"].pop_front()


# ----------------------------------------------------------------- orders ---

func order_stance(ship: Dictionary, stance: String) -> void:
	ship["stance"] = stance


func order_assign(ship: Dictionary, crew_id: String, st_id: String) -> bool:
	for c in ship["crew"]:
		if c["id"] != crew_id:
			continue
		if not c["alive"] or c["aboard"] != "own":
			return false
		if st_id != "":
			if not ship["stations"].has(st_id):
				return false
			var st: Dictionary = ship["stations"][st_id]
			if st["slots"] <= 0 or crew_at(ship, st_id).size() >= int(st["slots"]):
				return false
		c["station"] = st_id
		return true
	return false


func order_ammo(ship: Dictionary, weapon_id: String, ammo: String) -> void:
	for w in ship["weapons"]:
		if w["id"] == weapon_id:
			w["ammo"] = ammo


func order_hold_fire(ship: Dictionary, weapon_id: String, hold: bool) -> void:
	for w in ship["weapons"]:
		if w["id"] == weapon_id:
			w["hold_fire"] = hold


func order_target(ship: Dictionary, st_id: String) -> void:
	ship["target_station"] = st_id


func order_furnace(ship: Dictionary, lit: bool) -> void:
	ship["furnace_intent"] = lit
	if not lit:
		ship["furnace_lit"] = false
		ship["furnace_heat"] = 0.0


func order_grapple(ship: Dictionary, intent: bool) -> void:
	ship["grapple_intent"] = intent


func order_cut_lines(ship: Dictionary, intent: bool) -> void:
	ship["cut_intent"] = intent


func order_board(ship: Dictionary) -> void:
	if not battle["grappled"]:
		return
	var party := crew_at(ship, "muster")
	if party.is_empty():
		log_msg("%s: no one at the muster deck to board with!" % ship["name"])
		return
	for c in party:
		c["aboard"] = "foe"
		c["station"] = ""
	battle["boarding_side"] = ship["side"]
	log_msg("%s: boarders away! %d hands cross the rail." % [ship["name"], party.size()])


func order_recall(ship: Dictionary) -> void:
	if not battle["grappled"]:
		return  # lines cut — boarders are stranded until it ends
	var back := boarders_of(ship)
	for c in back:
		c["aboard"] = "own"
		var st: Dictionary = ship["stations"]["muster"]
		if crew_at(ship, "muster").size() < int(st["slots"]):
			c["station"] = "muster"
	if not back.is_empty():
		log_msg("%s recalls the boarding party." % ship["name"])


# ------------------------------------------------------------------- tick ---

func tick(dt: float) -> void:
	if battle["over"]:
		return
	battle["time"] += dt
	_tick_gage(dt)
	_tick_range(dt)
	_tick_ai(dt)
	_tick_ship(player, dt)
	_tick_ship(enemy, dt)
	_tick_grapple(dt)
	_tick_boarding(dt)
	_check_end()


func _tick_gage(dt: float) -> void:
	var diff := mobility(player) - mobility(enemy)
	battle["gage"] = clampf(battle["gage"] + clampf(diff, -1.0, 1.0) * 0.05 * dt, 0.0, 1.0)


func _stance_push(ship: Dictionary) -> float:
	var dir := 0.0
	match ship["stance"]:
		"close_in":
			dir = 1.0
		"break_away":
			dir = -1.0
	var gage_mult := 1.2 if gage_owner() == ship["side"] else 1.0
	return dir * 0.11 * (0.3 + mobility(ship)) * gage_mult


func _tick_range(dt: float) -> void:
	if battle["grappled"]:
		return
	var net := _stance_push(player) + _stance_push(enemy)
	battle["range_pos"] = clampf(battle["range_pos"] + net * dt, 0.0, 2.95)
	# Escape: at extreme long range, a faster break_away ship slips the fight.
	for ship in [player, enemy]:
		var foe := foe_of(ship)
		if ship["stance"] == "break_away" and battle["range_pos"] <= 0.05:
			var adv := mobility(ship) - mobility(foe)
			if adv > -0.05:
				ship["escape_progress"] = clampf(ship["escape_progress"] + dt * (0.05 + 0.1 * maxf(adv, 0.0)), 0.0, 1.0)
			else:
				ship["escape_progress"] = maxf(ship["escape_progress"] - dt * 0.05, 0.0)
			if ship["escape_progress"] >= 1.0:
				_finish("escape_" + ship["side"])
		else:
			ship["escape_progress"] = maxf(ship["escape_progress"] - dt * 0.1, 0.0)


# --------------------------------------------------------------- enemy AI ---

func _tick_ai(dt: float) -> void:
	_ai_timer += dt
	if _ai_timer < 1.0:
		return
	_ai_timer = 0.0
	match enemy["behavior"]:
		"flee":
			_ai_flee()
		"close_board":
			_ai_close_board()
		"stand_off":
			_ai_stand_off()


func _ai_flee() -> void:
	enemy["stance"] = "break_away"
	_ai_set_ammo("round")


func _ai_close_board() -> void:
	var b := band()
	if battle["grappled"]:
		enemy["stance"] = "hold"
		if battle["boarding_side"] == "" and crew_at(enemy, "muster").size() >= 2:
			order_board(enemy)
		return
	enemy["stance"] = "close_in" if b < 2 else "hold"
	enemy["grapple_intent"] = b == 2
	_ai_set_ammo("grape" if b == 2 and enemy["ammo"]["grape"] > 0 else "round")
	# Keep marines mustered for the assault.
	if b >= 1:
		for c in alive_crew(enemy):
			if c["role"] == "Brute" and c["station"] != "muster" and c["aboard"] == "own":
				order_assign(enemy, c["id"], "muster")


func _ai_stand_off() -> void:
	var pos: float = battle["range_pos"]
	if battle["grappled"]:
		enemy["stance"] = "hold"
		enemy["cut_intent"] = true
		return
	enemy["cut_intent"] = false
	if pos < 1.1:
		enemy["stance"] = "close_in"
	elif pos > 1.9:
		enemy["stance"] = "break_away"
	else:
		enemy["stance"] = "hold"
	if not enemy["furnace_intent"] and enemy["stations"].has("galley"):
		order_furnace(enemy, true)
	if sail_frac(player) > 0.5 and enemy["ammo"]["chain"] > 0:
		_ai_set_ammo("chain")
	elif enemy["furnace_lit"] and enemy["ammo"]["heated"] > 0 and rng.randf() < 0.4:
		_ai_set_ammo("heated")
	else:
		_ai_set_ammo("round")
	enemy["target_station"] = "cannons"


func _ai_set_ammo(ammo: String) -> void:
	if enemy["ammo"].get(ammo, 0) > 0:
		order_ammo(enemy, "battery", ammo)
	else:
		order_ammo(enemy, "battery", "round")


# ------------------------------------------------------------- ship systems ---

func _tick_ship(ship: Dictionary, dt: float) -> void:
	if ship["destroyed"] or battle["over"]:
		return
	_tick_furnace(ship, dt)
	_tick_weapons(ship, dt)
	_tick_swivels(ship, dt)
	_tick_fires(ship, dt)
	_tick_water(ship, dt)
	_tick_damage_control(ship, dt)
	_tick_sickbay(ship, dt)
	_tick_magazine(ship, dt)
	_tick_resolve(ship, dt)
	if ship["hull"] <= 0.0:
		_destroy(ship, "sunk by gunfire")
	elif ship["water"] >= 3.0:
		_destroy(ship, "flooded and lost")


func _tick_furnace(ship: Dictionary, dt: float) -> void:
	if not ship["stations"].has("galley"):
		return
	if ship["furnace_intent"] and station_eff(ship, "galley") > 0.0:
		if not ship["furnace_lit"]:
			ship["furnace_heat"] += dt / 8.0
			if ship["furnace_heat"] >= 1.0:
				ship["furnace_lit"] = true
				log_msg("%s: the galley furnace glows — heated shot ready." % ship["name"])
	else:
		ship["furnace_heat"] = maxf(ship["furnace_heat"] - dt / 4.0, 0.0)
		if ship["furnace_lit"] and station_eff(ship, "galley") <= 0.0:
			ship["furnace_lit"] = false


func _ammo_valid_now(ship: Dictionary, w: Dictionary) -> bool:
	var b := band()
	if ship["ammo"].get(w["ammo"], 0) <= 0:
		return false
	if w["kind"] == "mortar":
		return b <= 1
	match w["ammo"]:
		"grape":
			return b >= 2
		"heated":
			return ship["furnace_lit"] and b <= 2
		_:
			return b <= 2


func _tick_weapons(ship: Dictionary, dt: float) -> void:
	for w in ship["weapons"]:
		var eff := station_eff(ship, w["station"])
		if eff > 0.0 and w["timer"] < w["reload"]:
			w["timer"] += dt * eff / 2.0
		if w["hold_fire"] or w["timer"] < w["reload"]:
			continue
		if not _ammo_valid_now(ship, w):
			continue
		if w["kind"] == "mortar":
			_fire_mortar(ship, w)
		else:
			_fire_battery(ship, w)


func _accuracy(shooter: Dictionary, target: Dictionary) -> float:
	var base := [0.45, 0.65, 0.85, 0.9][band()]
	var acc: float = base - evasion(target)
	if gage_owner() == shooter["side"]:
		acc += 0.05
	return clampf(acc, 0.15, 0.95)


func _fire_battery(ship: Dictionary, w: Dictionary) -> void:
	var foe := foe_of(ship)
	var ammo: String = w["ammo"]
	ship["ammo"][ammo] -= 1
	w["timer"] = 0.0
	var acc := _accuracy(ship, foe)
	var pw: float = w["power"]
	match ammo:
		"round":
			var hits := 0
			for i in 3:
				if rng.randf() < acc:
					hits += 1
					foe["hull"] -= rng.randf_range(1.5, 2.3) * pw
					if rng.randf() < 0.3:
						foe["breaches"] += 1
						log_msg("%s is holed below the waterline!" % foe["name"])
					if rng.randf() < 0.35:
						_damage_station(ship, foe, pw)
			log_msg("%s: broadside — %d of 3 round shot strike home." % [ship["name"], hits])
		"chain":
			var shredded := 0.0
			for i in 3:
				if rng.randf() < acc:
					shredded += rng.randf_range(1.4, 2.2) * pw
			foe["sails"] = maxf(foe["sails"] - shredded, 0.0)
			log_msg("%s: chain shot howls through %s's rigging." % [ship["name"], foe["name"]])
			if foe["sails"] <= 0.0 and not foe["dismasted_logged"]:
				foe["dismasted_logged"] = true
				foe["resolve"] -= 15.0
				log_msg("%s is DISMASTED — dead in the water!" % foe["name"])
		"grape":
			var casualties := 0
			for i in 4:
				if rng.randf() < acc * 1.15:
					var victim := _exposed_crew(foe)
					if victim.is_empty():
						break
					if _injure_crew(foe, victim, rng.randf_range(2.5, 4.5) * pw):
						casualties += 1
			if casualties > 0:
				log_msg("%s: grapeshot sweeps %s's deck — %d down." % [ship["name"], foe["name"], casualties])
			else:
				log_msg("%s: grapeshot rattles off %s's rail." % [ship["name"], foe["name"]])
		"heated":
			var burns := 0
			for i in 2:
				if rng.randf() < acc:
					burns += 1
					foe["hull"] -= rng.randf_range(0.8, 1.4) * pw
					var deck := _random_deck()
					foe["fires"][deck] = minf(foe["fires"][deck] + 0.9, 3.0)
			if burns > 0:
				log_msg("%s: heated shot — FIRE aboard %s!" % [ship["name"], foe["name"]])
			else:
				log_msg("%s: heated shot hisses into the sea." % ship["name"])


func _fire_mortar(ship: Dictionary, w: Dictionary) -> void:
	var foe := foe_of(ship)
	ship["ammo"]["mortar"] -= 1
	w["timer"] = 0.0
	# Mortars arc: they can't lead a nimble target, but punish anything slow.
	var target_mobility := sail_frac(foe) * (0.5 + 0.5 * clampf(station_eff(foe, "helm"), 0.0, 2.0) / 2.0)
	var acc := clampf(0.85 - 0.6 * target_mobility, 0.1, 0.85)
	if rng.randf() < acc:
		foe["hull"] -= rng.randf_range(3.5, 5.5)
		var deck := _random_deck()
		foe["fires"][deck] = minf(foe["fires"][deck] + 0.5, 3.0)
		if rng.randf() < 0.5:
			_damage_station(ship, foe, 1.4)
		log_msg("%s: mortar shell CRASHES through %s!" % [ship["name"], foe["name"]])
	else:
		log_msg("%s: mortar shell throws up a great column of spray." % ship["name"])


func _random_deck() -> String:
	var r := rng.randf()
	if r < 0.25:
		return "weather"
	if r < 0.6:
		return "gun"
	return "hold"


func _damage_station(shooter: Dictionary, foe: Dictionary, pw: float) -> void:
	var st_id := ""
	var preferred: String = shooter["target_station"]
	if preferred != "" and foe["stations"].has(preferred) and foe["stations"][preferred]["hp"] > 0.0 and rng.randf() < 0.6:
		st_id = preferred
	else:
		var candidates := []
		for id in foe["stations"]:
			if foe["stations"][id]["hp"] > 0.0:
				candidates.append(id)
		if candidates.is_empty():
			return
		st_id = candidates[rng.randi_range(0, candidates.size() - 1)]
	var st: Dictionary = foe["stations"][st_id]
	st["hp"] = maxf(st["hp"] - rng.randf_range(1.5, 2.5) * pw, 0.0)
	if st["kind"] == "magazine" and rng.randf() < 0.25:
		_detonate_magazine(foe)
		return
	if st["hp"] <= 0.0:
		log_msg("%s's %s is wrecked!" % [foe["name"], st["label"]])
	# Splinters wound whoever is manning it.
	for c in crew_at(foe, st_id):
		if rng.randf() < 0.4:
			_injure_crew(foe, c, rng.randf_range(1.0, 3.0))


func _exposed_crew(ship: Dictionary) -> Dictionary:
	var exposed := []
	var sheltered := []
	for c in ship["crew"]:
		if not c["alive"] or c["aboard"] != "own":
			continue
		var deck := "weather"
		if c["station"] != "" and ship["stations"].has(c["station"]):
			deck = ship["stations"][c["station"]]["deck"]
		if deck == "weather":
			exposed.append(c)
		elif deck == "gun":
			sheltered.append(c)
	if not exposed.is_empty():
		return exposed[rng.randi_range(0, exposed.size() - 1)]
	if not sheltered.is_empty() and rng.randf() < 0.5:
		return sheltered[rng.randi_range(0, sheltered.size() - 1)]
	return {}


## Returns true if the hit killed them.
func _injure_crew(ship: Dictionary, c: Dictionary, dmg: float) -> bool:
	if c.is_empty() or not c["alive"]:
		return false
	c["hp"] -= dmg
	if c["hp"] <= 0.0:
		_kill_crew(ship, c)
		return true
	return false


func _kill_crew(ship: Dictionary, c: Dictionary) -> void:
	c["alive"] = false
	c["hp"] = 0.0
	c["station"] = ""
	ship["resolve"] -= 10.0
	log_msg("%s: %s (%s) is killed." % [ship["name"], c["name"], c["role"]])


func _tick_swivels(ship: Dictionary, dt: float) -> void:
	if not ship["stations"].has("swivels"):
		return
	_swivel_timers[ship["side"]] += dt
	if _swivel_timers[ship["side"]] < 3.0:
		return
	_swivel_timers[ship["side"]] = 0.0
	var eff := station_eff(ship, "swivels")
	if eff <= 0.0:
		return
	var foe := foe_of(ship)
	var invaders := boarders_of(foe)  # foe's crew standing on OUR deck
	if not invaders.is_empty():
		var target: Dictionary = invaders[rng.randi_range(0, invaders.size() - 1)]
		_injure_crew(foe, target, rng.randf_range(2.5, 4.0))
		log_msg("%s: swivel guns rake the boarders." % ship["name"])
	elif band() >= 2 and rng.randf() < 0.45:
		var victim := _exposed_crew(foe)
		if not victim.is_empty():
			_injure_crew(foe, victim, rng.randf_range(1.5, 3.0))


func _tick_fires(ship: Dictionary, dt: float) -> void:
	var decks_above := {"hold": "gun", "gun": "weather"}
	for deck in D.DECKS:
		var f: float = ship["fires"][deck]
		if f <= 0.0:
			continue
		if deck_flooded(ship, deck):
			ship["fires"][deck] = 0.0
			continue
		# Grow, gnaw stations, scorch crew, and try to climb.
		ship["fires"][deck] = minf(f + dt * 0.04 * (1.0 + f * 0.3), 3.0)
		for st_id in ship["stations"]:
			var st: Dictionary = ship["stations"][st_id]
			if st["deck"] == deck and st["hp"] > 0.0:
				st["hp"] = maxf(st["hp"] - dt * 0.12 * f, 0.0)
		for c in ship["crew"]:
			if c["alive"] and c["aboard"] == "own" and c["station"] != "" \
					and ship["stations"][c["station"]]["deck"] == deck:
				_injure_crew(ship, c, dt * 0.25 * f)
		if f >= 1.5 and decks_above.has(deck) and rng.randf() < 0.05 * dt * f * 10.0:
			var above: String = decks_above[deck]
			if ship["fires"][above] <= 0.0:
				log_msg("%s: the fire spreads to the %s deck!" % [ship["name"], above])
			ship["fires"][above] = minf(ship["fires"][above] + 0.5, 3.0)


func _tick_water(ship: Dictionary, dt: float) -> void:
	var intake: float = ship["breaches"] * 0.022
	var pumped := 0.035 * station_eff(ship, "pumps") / 2.0 if ship["stations"].has("pumps") else 0.0
	ship["water"] = clampf(ship["water"] + (intake - pumped) * dt, 0.0, 3.0)
	# Crew flee flooded stations and become idle damage-control hands.
	for c in ship["crew"]:
		if c["alive"] and c["aboard"] == "own" and c["station"] != "" \
				and station_flooded(ship, c["station"]):
			c["station"] = ""


## Idle crew fight the worst fire first, then patch breaches (carpenters are
## thrice the hands), then slowly mend wrecked stations.
func _tick_damage_control(ship: Dictionary, dt: float) -> void:
	var idle := idle_crew(ship)
	if idle.is_empty():
		return
	var worst_deck := ""
	var worst := 0.0
	for deck in D.DECKS:
		if ship["fires"][deck] > worst:
			worst = ship["fires"][deck]
			worst_deck = deck
	if worst_deck != "":
		var doused: float = ship["fires"][worst_deck] - dt * 0.15 * idle.size()
		ship["fires"][worst_deck] = maxf(doused, 0.0)
		if ship["fires"][worst_deck] <= 0.0:
			log_msg("%s: fire on the %s deck is out." % [ship["name"], worst_deck])
		return
	if ship["breaches"] > 0:
		var rate := 0.0
		for c in idle:
			rate += 0.36 if c["role"] == "Carpenter" else 0.12
		ship["breach_repair"] += dt * rate
		if ship["breach_repair"] >= 1.0:
			ship["breach_repair"] = 0.0
			ship["breaches"] -= 1
			log_msg("%s: a breach is plugged and caulked." % ship["name"])
		return
	# Nothing burning or leaking: patch up the most damaged station.
	var target_id := ""
	var worst_frac := 1.0
	for st_id in ship["stations"]:
		var st: Dictionary = ship["stations"][st_id]
		var frac: float = st["hp"] / st["hp_max"]
		if frac < worst_frac:
			worst_frac = frac
			target_id = st_id
	if target_id != "":
		var st: Dictionary = ship["stations"][target_id]
		st["hp"] = minf(st["hp"] + dt * 0.25 * idle.size(), st["hp_max"])


func _tick_sickbay(ship: Dictionary, dt: float) -> void:
	if not ship["stations"].has("sickbay"):
		return
	var eff := station_eff(ship, "sickbay")
	if eff <= 0.0:
		return
	for c in ship["crew"]:
		if c["alive"] and c["hp"] < c["hp_max"]:
			c["hp"] = minf(c["hp"] + dt * 0.12 * eff, c["hp_max"])


func _tick_magazine(ship: Dictionary, dt: float) -> void:
	if not ship["stations"].has("magazine"):
		return
	var mag: Dictionary = ship["stations"]["magazine"]
	if mag["hp"] <= 0.0:
		return
	if ship["fires"]["hold"] > 0.5:
		ship["magazine_heat"] += dt * ship["fires"]["hold"] * 0.08
		if ship["magazine_heat"] >= 1.0:
			_detonate_magazine(ship)
	else:
		ship["magazine_heat"] = maxf(ship["magazine_heat"] - dt * 0.1, 0.0)


func _detonate_magazine(ship: Dictionary) -> void:
	var mag: Dictionary = ship["stations"]["magazine"]
	mag["hp"] = 0.0
	ship["hull"] -= 8.0
	ship["sails"] = maxf(ship["sails"] - 2.0, 0.0)
	ship["fires"]["hold"] = minf(ship["fires"]["hold"] + 1.5, 3.0)
	ship["fires"]["gun"] = minf(ship["fires"]["gun"] + 0.8, 3.0)
	ship["resolve"] -= 25.0
	log_msg("!!! %s's POWDER MAGAZINE EXPLODES !!!" % ship["name"])
	for c in ship["crew"]:
		if c["alive"] and c["aboard"] == "own" and c["station"] != "" \
				and ship["stations"][c["station"]]["deck"] == "hold":
			_injure_crew(ship, c, 6.0)


func _tick_resolve(ship: Dictionary, dt: float) -> void:
	if not ship["can_surrender"] or battle["over"]:
		return
	var hull_frac: float = ship["hull"] / ship["hull_max"]
	if hull_frac < 0.5:
		ship["resolve"] -= dt * 0.4 * (1.0 - hull_frac)
	var total_fire: float = ship["fires"]["weather"] + ship["fires"]["gun"] + ship["fires"]["hold"]
	ship["resolve"] -= dt * 0.3 * total_fire
	if ship["water"] > 1.0:
		ship["resolve"] -= dt * 0.5
	if ship["resolve"] <= 0.0:
		_finish("surrender_" + ship["side"])


# ------------------------------------------------------ grapple & boarding ---

func _tick_grapple(dt: float) -> void:
	if battle["over"]:
		return
	if not battle["grappled"]:
		if band() != 2:
			return
		var seeker := ""
		for ship in [player, enemy]:
			if ship["grapple_intent"]:
				seeker = ship["side"]
		if seeker == "":
			return
		_grapple_timer += dt
		if _grapple_timer < 2.0:
			return
		_grapple_timer = 0.0
		var ship := ship_for(seeker)
		var chance := 0.45 + 0.08 * crew_at(ship, "muster").size()
		if rng.randf() < chance:
			battle["grappled"] = true
			log_msg("GRAPPLED! %s's hooks bite into the rail — the ships are locked together." % ship["name"])
	else:
		# A defender can hack the lines through and break the lock.
		for ship in [player, enemy]:
			if not ship["cut_intent"]:
				continue
			var eff := station_eff(ship, "muster") + 0.5 * idle_crew(ship).size()
			ship["cut_progress"] += dt * 0.09 * eff
			if ship["cut_progress"] >= 1.0:
				ship["cut_progress"] = 0.0
				battle["grappled"] = false
				battle["range_pos"] = 2.6
				log_msg("%s cuts the grappling lines — the ships drift apart!" % ship["name"])
				var attacker := foe_of(ship)
				if not boarders_of(attacker).is_empty():
					log_msg("%s's boarders are STRANDED on the enemy deck!" % attacker["name"])


func _tick_boarding(dt: float) -> void:
	if battle["boarding_side"] == "" or battle["over"]:
		return
	var attacker := ship_for(battle["boarding_side"])
	var defender := foe_of(attacker)
	var attackers := boarders_of(attacker)
	if attackers.is_empty():
		battle["boarding_side"] = ""
		return
	var defenders := alive_crew(defender).filter(func(c): return c["aboard"] == "own")
	if defenders.is_empty():
		_finish("captured_" + attacker["side"])
		return
	_melee_timer += dt
	if _melee_timer < 1.0:
		return
	_melee_timer = 0.0
	# Attackers swing first; survivors swing back. Stationed defenders fight
	# distracted (0.75x) — mustered or idle hands fight at full strength.
	for a in attackers:
		if not a["alive"] or defenders.is_empty():
			break
		var target: Dictionary = defenders[rng.randi_range(0, defenders.size() - 1)]
		var atk: float = D.ROLE_ATK.get(a["role"], 1.0)
		if _injure_crew(defender, target, atk * rng.randf_range(0.8, 1.2)):
			defenders.erase(target)
	for d in defenders:
		if not d["alive"] or attackers.is_empty():
			break
		var target: Dictionary = attackers[rng.randi_range(0, attackers.size() - 1)]
		var atk: float = D.ROLE_ATK.get(d["role"], 1.0)
		if d["station"] != "" and d["station"] != "muster":
			atk *= 0.75
		if _injure_crew(attacker, target, atk * rng.randf_range(0.8, 1.2)):
			attackers.erase(target)


# -------------------------------------------------------------- end states ---

func _destroy(ship: Dictionary, cause: String) -> void:
	if ship["destroyed"]:
		return
	ship["destroyed"] = true
	log_msg("%s is %s — she slips beneath the waves." % [ship["name"], cause])
	_finish("destroyed_" + ship["side"])


func _check_end() -> void:
	if battle["over"]:
		return
	if alive_crew(player).is_empty():
		_finish("crew_wiped_player")
	elif alive_crew(enemy).is_empty():
		_finish("crew_wiped_enemy")


func _finish(outcome: String) -> void:
	if battle["over"]:
		return
	battle["over"] = true
	battle["outcome"] = outcome
	battle["summary"] = _summary_for(outcome)
	log_msg("--- %s ---" % battle["summary"])


func _summary_for(outcome: String) -> String:
	match outcome:
		"destroyed_enemy":
			return "VICTORY — %s sinks. Whatever she carried sinks with her: a few crates of flotsam." % enemy["name"]
		"destroyed_player":
			return "DEFEAT — the Reckless is lost with all hands."
		"surrender_enemy":
			return "VICTORY — %s strikes her colors! A fine prize, taken nearly whole." % enemy["name"]
		"surrender_player":
			return "DEFEAT — your crew hauls down the black flag."
		"captured_player":
			return "VICTORY — you sweep her decks and take %s intact. Maximum plunder!" % enemy["name"]
		"captured_enemy":
			return "DEFEAT — enemy boarders take the Reckless."
		"crew_wiped_enemy":
			return "VICTORY — not a soul left to sail her. %s is yours for the taking." % enemy["name"]
		"crew_wiped_player":
			return "DEFEAT — the Reckless drifts, a ghost ship."
		"escape_enemy":
			return "THE PRIZE ESCAPES — %s shows you her heels. Nothing gained." % enemy["name"]
		"escape_player":
			return "WITHDRAWN — you break off the action and live to fight again."
	return outcome
