## Headless smoke test for the battle sim. Run from the project directory:
##   godot --headless --script tests/sim_smoke.gd
## Plays scripted policies against each enemy several times and prints
## outcomes. Fails (exit 1) only if a battle never terminates or errors.
extends SceneTree

const D := preload("res://src/defs.gd")
const BattleSimScript := preload("res://src/battle_sim.gd")

const MAX_TIME := 420.0


func _init() -> void:
	var failures := 0
	var seed_value := 1000
	for enemy_id in D.enemy_ids():
		for trial in 3:
			seed_value += 1
			var result := _run_battle(enemy_id, seed_value)
			print("%-14s trial %d  ->  %-22s t=%5.1fs  playerHull=%4.1f  enemyHull=%4.1f" % [
				enemy_id, trial, result["outcome"], result["time"],
				result["player_hull"], result["enemy_hull"],
			])
			if result["outcome"] == "TIMEOUT":
				failures += 1
	if failures > 0:
		print("SMOKE TEST FAILED: %d battles did not terminate in %ds" % [failures, int(MAX_TIME)])
		quit(1)
	else:
		print("SMOKE TEST OK: all battles terminated.")
		quit(0)


func _run_battle(enemy_id: String, seed_value: int) -> Dictionary:
	var sim := BattleSimScript.new(D.player_ship(), D.enemy_ship(enemy_id), seed_value)
	while not sim.battle["over"] and sim.battle["time"] < MAX_TIME:
		_policy(sim, enemy_id)
		sim.tick(D.TICK)
	return {
		"outcome": sim.battle["outcome"] if sim.battle["over"] else "TIMEOUT",
		"time": sim.battle["time"],
		"player_hull": sim.player["hull"],
		"enemy_hull": sim.enemy["hull"],
	}


## A crude scripted captain that plays each matchup roughly as intended.
func _policy(sim: BattleSim, enemy_id: String) -> void:
	var p: Dictionary = sim.player
	match enemy_id:
		"merchant_brig":
			# Chain her sails down, close, and let resolve break her.
			sim.order_stance(p, "close_in")
			if sim.sail_frac(sim.enemy) > 0.3 and p["ammo"]["chain"] > 0:
				sim.order_ammo(p, "battery", "chain")
			elif sim.band() >= 2 and p["ammo"]["grape"] > 0:
				sim.order_ammo(p, "battery", "grape")
			else:
				sim.order_ammo(p, "battery", "round")
			sim.order_grapple(p, sim.band() == 2)
			if sim.battle["grappled"] and sim.boarders_of(p).is_empty():
				sim.order_board(p)
		"navy_sloop":
			# Refuse the boarding fight: keep away and pound her.
			sim.order_stance(p, "break_away" if sim.band() >= 2 else "hold")
			sim.order_ammo(p, "battery", "grape" if sim.band() >= 2 and p["ammo"]["grape"] > 0 else "round")
			sim.order_cut_lines(p, sim.battle["grappled"])
		"navy_frigate":
			# Rush in and board before her broadsides settle it.
			sim.order_stance(p, "close_in")
			sim.order_ammo(p, "battery", "chain" if p["ammo"]["chain"] > 4 else "round")
			sim.order_grapple(p, sim.band() == 2)
			if sim.battle["grappled"] and sim.boarders_of(p).is_empty():
				# Muster everyone who can hold a blade, then go.
				for c in sim.alive_crew(p):
					if c["aboard"] == "own" and c["role"] != "Surgeon" and c["station"] != "muster":
						sim.order_assign(p, c["id"], "muster")
				if sim.crew_at(p, "muster").size() >= 3:
					sim.order_board(p)
