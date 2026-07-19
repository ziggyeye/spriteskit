## Battle screen: renders BattleSim state and turns taps into sim orders.
## Grey-box on purpose — every rectangle here becomes FAL art later.
## Tapping a crewman auto-pauses; all decisions can be made while paused.
class_name BattleView
extends Control

signal finished

const D := preload("res://src/defs.gd")
const BattleSimScript := preload("res://src/battle_sim.gd")

const COL_BG := Color(0.07, 0.08, 0.11)
const COL_PANEL := Color(0.13, 0.15, 0.19)
const COL_PANEL_ENEMY := Color(0.16, 0.12, 0.13)
const COL_STATION := Color(0.2, 0.22, 0.27)
const COL_TEXT := Color(0.88, 0.88, 0.92)
const COL_DIM := Color(0.55, 0.57, 0.62)
const COL_HULL := Color(0.78, 0.42, 0.32)
const COL_SAIL := Color(0.45, 0.68, 0.9)
const COL_RESOLVE := Color(0.9, 0.8, 0.4)
const COL_RELOAD := Color(0.95, 0.65, 0.3)
const COL_FIRE := Color(1.0, 0.45, 0.15)
const COL_WATER := Color(0.3, 0.55, 0.9)
const COL_GOOD := Color(0.5, 0.85, 0.55)

var sim: BattleSim
var paused := false
var speed := 1.0
var _acc := 0.0
var selected_crew := ""

# side -> station id -> widget refs
var station_widgets := {"player": {}, "enemy": {}}
var crew_chips := {}          # crew id -> Button
var idle_trays := {}          # side -> chips HBox
var boarder_trays := {}       # side of the SHIP -> chips HBox (holds foe crew)
var ship_bars := {}           # side -> {hull, sails, resolve, status}
var weapon_widgets := []      # {weapon, bar, ammo_btn, hold_btn, note}
var band_segments := []
var deck_tags := {"player": {}, "enemy": {}}

var top_status: Label
var wind_label: Label
var grapple_banner: Label
var escape_label: Label
var log_label: Label
var pause_btn: Button
var speed_btn: Button
var furnace_btn: Button
var target_label: Label
var stance_btns := {}
var action_btns := {}
var end_overlay: Control
var end_summary: Label


func _init(enemy_id: String) -> void:
	sim = BattleSimScript.new(D.player_ship(), D.enemy_ship(enemy_id))


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	var th := Theme.new()
	th.default_font_size = 26
	theme = th

	var bg := ColorRect.new()
	bg.color = COL_BG
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	for m in ["margin_left", "margin_right", "margin_top", "margin_bottom"]:
		margin.add_theme_constant_override(m, 14)
	add_child(margin)

	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 10)
	margin.add_child(root)

	_build_top_bar(root)
	_build_ship_panel(root, "enemy")
	_build_mid_strip(root)
	_build_stance_row(root)
	_build_ship_panel(root, "player")
	_build_weapons_row(root)
	_build_log(root)
	_build_end_overlay()
	_build_crew_chips()
	_refresh()


func _process(delta: float) -> void:
	if paused or sim.battle["over"]:
		return
	_acc += delta * speed
	var ticked := false
	while _acc >= D.TICK:
		_acc -= D.TICK
		sim.tick(D.TICK)
		ticked = true
	if ticked:
		_refresh()


# -------------------------------------------------------------- UI helpers ---

func _lbl(text: String, size := 24, color := COL_TEXT) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l


func _btn(text: String, size: int, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.add_theme_font_size_override("font_size", size)
	b.pressed.connect(cb)
	return b


func _flat_style(color: Color, radius := 8) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = color
	sb.set_corner_radius_all(radius)
	sb.content_margin_left = 8.0
	sb.content_margin_right = 8.0
	sb.content_margin_top = 6.0
	sb.content_margin_bottom = 6.0
	return sb


func _panel(color: Color) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", _flat_style(color))
	return p


func _bar(color: Color, h := 14) -> Dictionary:
	var wrap := Control.new()
	wrap.custom_minimum_size = Vector2(0, h)
	wrap.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var bgr := ColorRect.new()
	bgr.color = Color(0.0, 0.0, 0.0, 0.35)
	bgr.set_anchors_preset(Control.PRESET_FULL_RECT)
	wrap.add_child(bgr)
	var fg := ColorRect.new()
	fg.color = color
	fg.anchor_left = 0.0
	fg.anchor_top = 0.0
	fg.anchor_bottom = 1.0
	fg.anchor_right = 1.0
	wrap.add_child(fg)
	return {"root": wrap, "fg": fg}


func _set_bar(bar: Dictionary, frac: float) -> void:
	bar["fg"].anchor_right = clampf(frac, 0.0, 1.0)


# ---------------------------------------------------------------- building ---

func _build_top_bar(root: VBoxContainer) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	top_status = _lbl("", 30)
	top_status.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(top_status)
	speed_btn = _btn("x1", 26, _on_speed)
	row.add_child(speed_btn)
	pause_btn = _btn("PAUSE", 26, _on_pause)
	row.add_child(pause_btn)
	root.add_child(row)


func _build_ship_panel(root: VBoxContainer, side: String) -> void:
	var ship: Dictionary = sim.ship_for(side)
	var panel := _panel(COL_PANEL_ENEMY if side == "enemy" else COL_PANEL)
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 6)
	panel.add_child(vb)

	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 10)
	var name_l := _lbl(ship["name"], 28)
	name_l.custom_minimum_size = Vector2(260, 0)
	head.add_child(name_l)
	var bars := {}
	for spec in [["hull", COL_HULL], ["sails", COL_SAIL]]:
		var b: Dictionary = _bar(spec[1])
		head.add_child(b["root"])
		bars[spec[0]] = b
	if ship["can_surrender"]:
		var rb := _bar(COL_RESOLVE)
		head.add_child(rb["root"])
		bars["resolve"] = rb
	vb.add_child(head)
	var status := _lbl("", 20, COL_DIM)
	bars["status"] = status
	vb.add_child(status)
	ship_bars[side] = bars

	for deck in D.DECKS:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		var tag_box := VBoxContainer.new()
		tag_box.custom_minimum_size = Vector2(96, 0)
		tag_box.add_child(_lbl(deck.to_upper(), 18, COL_DIM))
		var hazard := _lbl("", 18, COL_FIRE)
		tag_box.add_child(hazard)
		deck_tags[side][deck] = hazard
		row.add_child(tag_box)
		for st_id in ship["stations"]:
			var st: Dictionary = ship["stations"][st_id]
			if st["deck"] != deck:
				continue
			row.add_child(_make_station_box(side, st_id, st))
		vb.add_child(row)

	# Tray for idle hands (player only interacts, but both need one) and for
	# enemy boarders standing on this deck.
	var tray_row := HBoxContainer.new()
	tray_row.add_theme_constant_override("separation", 8)
	var idle_box := _panel(COL_STATION.darkened(0.2))
	var idle_vb := VBoxContainer.new()
	idle_vb.add_child(_lbl("OFF DUTY (damage control)", 17, COL_DIM))
	var idle_chips := HBoxContainer.new()
	idle_chips.add_theme_constant_override("separation", 4)
	idle_chips.custom_minimum_size = Vector2(0, 48)
	idle_vb.add_child(idle_chips)
	idle_box.add_child(idle_vb)
	idle_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if side == "player":
		idle_box.gui_input.connect(_on_station_tapped.bind(side, ""))
	tray_row.add_child(idle_box)
	idle_trays[side] = idle_chips

	var board_box := _panel(Color(0.3, 0.12, 0.12))
	var board_vb := VBoxContainer.new()
	board_vb.add_child(_lbl("BOARDERS ON DECK", 17, Color(1.0, 0.6, 0.5)))
	var board_chips := HBoxContainer.new()
	board_chips.add_theme_constant_override("separation", 4)
	board_chips.custom_minimum_size = Vector2(0, 48)
	board_vb.add_child(board_chips)
	board_box.add_child(board_vb)
	board_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tray_row.add_child(board_box)
	boarder_trays[side] = board_chips

	vb.add_child(tray_row)
	root.add_child(panel)


func _make_station_box(side: String, st_id: String, st: Dictionary) -> PanelContainer:
	var box := _panel(COL_STATION)
	box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 3)
	vb.add_child(_lbl(st["label"], 18))
	var hp := _bar(COL_GOOD, 8)
	vb.add_child(hp["root"])
	var chips := HBoxContainer.new()
	chips.add_theme_constant_override("separation", 4)
	chips.custom_minimum_size = Vector2(0, 48)
	vb.add_child(chips)
	box.add_child(vb)
	box.gui_input.connect(_on_station_tapped.bind(side, st_id))
	station_widgets[side][st_id] = {"box": box, "hp": hp, "chips": chips, "style": box.get_theme_stylebox("panel")}
	return box


func _build_mid_strip(root: VBoxContainer) -> void:
	var strip := VBoxContainer.new()
	strip.add_theme_constant_override("separation", 4)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)
	for i in 3:
		var seg := _panel(COL_STATION)
		seg.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var seg_l := _lbl(D.BAND_NAMES[i], 20, COL_DIM)
		seg_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		seg.add_child(seg_l)
		row.add_child(seg)
		band_segments.append({"panel": seg, "label": seg_l})
	strip.add_child(row)
	grapple_banner = _lbl("SHIPS GRAPPLED — boarding actions possible", 24, COL_FIRE)
	grapple_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	grapple_banner.visible = false
	strip.add_child(grapple_banner)
	var info := HBoxContainer.new()
	info.add_theme_constant_override("separation", 20)
	wind_label = _lbl("", 22, COL_SAIL)
	wind_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info.add_child(wind_label)
	escape_label = _lbl("", 22, COL_RESOLVE)
	info.add_child(escape_label)
	strip.add_child(info)
	root.add_child(strip)


func _build_stance_row(root: VBoxContainer) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	for spec in [["close_in", "CLOSE IN"], ["hold", "HOLD"], ["break_away", "BREAK OFF"]]:
		var b := _btn(spec[1], 24, _on_stance.bind(spec[0]))
		b.toggle_mode = true
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(b)
		stance_btns[spec[0]] = b
	for spec in [
		["grapple", "GRAPPLE", _on_grapple],
		["cut", "CUT LINES", _on_cut],
		["board", "BOARD!", _on_board],
		["recall", "RECALL", _on_recall],
	]:
		var b: Button = _btn(spec[1], 24, spec[2])
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		if spec[0] == "grapple" or spec[0] == "cut":
			b.toggle_mode = true
		row.add_child(b)
		action_btns[spec[0]] = b
	root.add_child(row)


func _build_weapons_row(root: VBoxContainer) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	for w in sim.player["weapons"]:
		var box := _panel(COL_PANEL)
		box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var vb := VBoxContainer.new()
		vb.add_theme_constant_override("separation", 4)
		vb.add_child(_lbl(w["label"], 22))
		var bar := _bar(COL_RELOAD, 12)
		vb.add_child(bar["root"])
		var btns := HBoxContainer.new()
		btns.add_theme_constant_override("separation", 6)
		var ammo_btn := _btn("", 20, _on_cycle_ammo.bind(w))
		ammo_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btns.add_child(ammo_btn)
		var hold_btn := _btn("HOLD", 20, _on_hold_fire.bind(w))
		hold_btn.toggle_mode = true
		hold_btn.button_pressed = w["hold_fire"]
		btns.add_child(hold_btn)
		vb.add_child(btns)
		var note := _lbl("", 17, COL_DIM)
		vb.add_child(note)
		box.add_child(vb)
		row.add_child(box)
		weapon_widgets.append({"weapon": w, "bar": bar, "ammo_btn": ammo_btn, "hold_btn": hold_btn, "note": note})

	var side_box := _panel(COL_PANEL)
	var side_vb := VBoxContainer.new()
	side_vb.add_theme_constant_override("separation", 4)
	furnace_btn = _btn("LIGHT FURNACE", 20, _on_furnace)
	furnace_btn.toggle_mode = true
	side_vb.add_child(furnace_btn)
	target_label = _lbl("Target: hull (tap an enemy station)", 17, COL_DIM)
	target_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	target_label.custom_minimum_size = Vector2(230, 0)
	side_vb.add_child(target_label)
	side_box.add_child(side_vb)
	row.add_child(side_box)
	root.add_child(row)


func _build_log(root: VBoxContainer) -> void:
	var panel := _panel(Color(0.05, 0.06, 0.08))
	log_label = _lbl("", 19, COL_DIM)
	log_label.custom_minimum_size = Vector2(0, 120)
	log_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	panel.add_child(log_label)
	root.add_child(panel)


func _build_end_overlay() -> void:
	end_overlay = Control.new()
	end_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	end_overlay.visible = false
	var dim := ColorRect.new()
	dim.color = Color(0.0, 0.0, 0.0, 0.72)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	end_overlay.add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	var panel := _panel(COL_PANEL)
	panel.custom_minimum_size = Vector2(860, 0)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 18)
	end_summary = _lbl("", 30)
	end_summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(end_summary)
	vb.add_child(_btn("RETURN TO HARBOR", 28, func(): finished.emit()))
	panel.add_child(vb)
	center.add_child(panel)
	end_overlay.add_child(center)
	add_child(end_overlay)


func _build_crew_chips() -> void:
	for side in ["player", "enemy"]:
		var ship: Dictionary = sim.ship_for(side)
		for c in ship["crew"]:
			var chip := Button.new()
			chip.toggle_mode = side == "player"
			chip.add_theme_font_size_override("font_size", 20)
			chip.custom_minimum_size = Vector2(64, 44)
			chip.tooltip_text = "%s — %s" % [c["name"], c["role"]]
			chip.self_modulate = D.ROLE_COLORS.get(c["role"], Color.WHITE)
			if side == "player":
				chip.pressed.connect(_on_crew_tapped.bind(c["id"]))
			else:
				chip.disabled = true
			crew_chips[c["id"]] = chip
			idle_trays[side].add_child(chip)


# ------------------------------------------------------------------ input ---

func _on_pause() -> void:
	paused = not paused
	_refresh()


func _on_speed() -> void:
	speed = 2.0 if speed == 1.0 else 1.0
	speed_btn.text = "x%d" % int(speed)


func _on_stance(stance: String) -> void:
	sim.order_stance(sim.player, stance)
	_refresh()


func _on_grapple() -> void:
	sim.order_grapple(sim.player, action_btns["grapple"].button_pressed)
	_refresh()


func _on_cut() -> void:
	sim.order_cut_lines(sim.player, action_btns["cut"].button_pressed)
	_refresh()


func _on_board() -> void:
	sim.order_board(sim.player)
	_refresh()


func _on_recall() -> void:
	sim.order_recall(sim.player)
	_refresh()


func _on_furnace() -> void:
	sim.order_furnace(sim.player, furnace_btn.button_pressed)
	_refresh()


func _on_cycle_ammo(w: Dictionary) -> void:
	if w["kind"] == "mortar":
		return
	var types: Array = D.AMMO_TYPES
	var idx := types.find(w["ammo"])
	sim.order_ammo(sim.player, w["id"], types[(idx + 1) % types.size()])
	_refresh()


func _on_hold_fire(w: Dictionary) -> void:
	for ww in weapon_widgets:
		if ww["weapon"] == w:
			sim.order_hold_fire(sim.player, w["id"], ww["hold_btn"].button_pressed)
	_refresh()


func _on_crew_tapped(crew_id: String) -> void:
	if selected_crew == crew_id:
		selected_crew = ""
	else:
		selected_crew = crew_id
		paused = true  # picking up a crewman auto-pauses: think, then act
	_refresh()


func _on_station_tapped(event: InputEvent, side: String, st_id: String) -> void:
	if not (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT):
		return
	if side == "player":
		if selected_crew != "":
			sim.order_assign(sim.player, selected_crew, st_id)
			selected_crew = ""
	else:
		# Tapping an enemy station aims your round shot at it.
		if sim.player["target_station"] == st_id:
			sim.order_target(sim.player, "")
		else:
			sim.order_target(sim.player, st_id)
	_refresh()


# ---------------------------------------------------------------- refresh ---

func _refresh() -> void:
	var b := sim.band()
	pause_btn.text = "RESUME" if paused else "PAUSE"
	top_status.text = "%s  —  %s" % [sim.enemy["title"], sim.band_name()]

	for i in band_segments.size():
		var seg: Dictionary = band_segments[i]
		var active: bool = (i == b) or (b == 3 and i == 2)
		seg["label"].add_theme_color_override("font_color", COL_TEXT if active else COL_DIM)
		seg["panel"].add_theme_stylebox_override("panel", _flat_style(COL_RELOAD.darkened(0.55) if active else COL_STATION))
	grapple_banner.visible = sim.battle["grappled"]

	match sim.gage_owner():
		"player":
			wind_label.text = "WIND: you hold the weather gage"
		"enemy":
			wind_label.text = "WIND: the enemy holds the weather gage"
		_:
			wind_label.text = "WIND: contested"

	var esc := ""
	if sim.enemy["escape_progress"] > 0.02:
		esc = "She's getting away! %d%%" % int(sim.enemy["escape_progress"] * 100.0)
	elif sim.player["escape_progress"] > 0.02:
		esc = "Slipping away... %d%%" % int(sim.player["escape_progress"] * 100.0)
	escape_label.text = esc

	for side in ["player", "enemy"]:
		_refresh_ship(side)
	_refresh_crew()
	_refresh_weapons()
	_refresh_actions()

	var lines: Array = sim.battle["log"]
	var tail := lines.slice(maxi(lines.size() - 5, 0))
	log_label.text = "\n".join(PackedStringArray(tail))

	if sim.battle["over"]:
		end_overlay.visible = true
		end_summary.text = sim.battle["summary"] + "\n\n" + _post_mortem()


func _refresh_ship(side: String) -> void:
	var ship: Dictionary = sim.ship_for(side)
	var bars: Dictionary = ship_bars[side]
	_set_bar(bars["hull"], ship["hull"] / ship["hull_max"])
	_set_bar(bars["sails"], ship["sails"] / ship["sails_max"])
	if bars.has("resolve"):
		_set_bar(bars["resolve"], ship["resolve"] / ship["resolve_max"])
	var bits := PackedStringArray()
	bits.append("Hull %d/%d" % [int(maxf(ship["hull"], 0.0)), int(ship["hull_max"])])
	bits.append("Sails %d/%d" % [int(ship["sails"]), int(ship["sails_max"])])
	if ship["breaches"] > 0:
		bits.append("%d BREACHES" % ship["breaches"])
	if ship["water"] > 0.05:
		bits.append("FLOODING %.1f/3" % ship["water"])
	if ship["furnace_lit"]:
		bits.append("furnace HOT")
	elif ship["furnace_intent"]:
		bits.append("furnace heating %d%%" % int(ship["furnace_heat"] * 100.0))
	bars["status"].text = "   ".join(bits)

	for deck in D.DECKS:
		var f: float = ship["fires"][deck]
		var tag: Label = deck_tags[side][deck]
		if sim.deck_flooded(ship, deck):
			tag.text = "FLOODED"
			tag.add_theme_color_override("font_color", COL_WATER)
		elif f > 0.0:
			tag.text = "FIRE %.1f" % f
			tag.add_theme_color_override("font_color", COL_FIRE)
		else:
			tag.text = ""

	for st_id in station_widgets[side]:
		var wdg: Dictionary = station_widgets[side][st_id]
		var st: Dictionary = ship["stations"][st_id]
		_set_bar(wdg["hp"], st["hp"] / st["hp_max"])
		var col := COL_STATION
		if st["hp"] <= 0.0:
			col = Color(0.1, 0.1, 0.1)
		elif sim.station_flooded(ship, st_id):
			col = COL_WATER.darkened(0.6)
		elif ship["fires"][st["deck"]] > 0.0:
			col = COL_FIRE.darkened(0.65)
		if side == "enemy" and sim.player["target_station"] == st_id:
			var sb := _flat_style(col)
			sb.border_color = COL_RELOAD
			sb.set_border_width_all(4)
			wdg["box"].add_theme_stylebox_override("panel", sb)
		else:
			wdg["box"].add_theme_stylebox_override("panel", _flat_style(col))


func _refresh_crew() -> void:
	for side in ["player", "enemy"]:
		var ship: Dictionary = sim.ship_for(side)
		var foe_side := "enemy" if side == "player" else "player"
		for c in ship["crew"]:
			var chip: Button = crew_chips[c["id"]]
			chip.visible = c["alive"]
			if not c["alive"]:
				continue
			chip.text = "%s %d" % [c["role"].substr(0, 1), int(ceilf(c["hp"]))]
			if side == "player":
				chip.button_pressed = selected_crew == c["id"]
			var parent: Container
			if c["aboard"] == "foe":
				parent = boarder_trays[foe_side]
			elif c["station"] == "":
				parent = idle_trays[side]
			else:
				parent = station_widgets[side][c["station"]]["chips"]
			if chip.get_parent() != parent:
				chip.get_parent().remove_child(chip)
				parent.add_child(chip)


func _refresh_weapons() -> void:
	for ww in weapon_widgets:
		var w: Dictionary = ww["weapon"]
		_set_bar(ww["bar"], w["timer"] / w["reload"])
		var count: int = sim.player["ammo"].get(w["ammo"], 0)
		ww["ammo_btn"].text = "%s ×%d" % [D.AMMO_LABELS[w["ammo"]], count]
		ww["hold_btn"].button_pressed = w["hold_fire"]
		var note := ""
		if count <= 0:
			note = "out of ammo"
		elif not sim._ammo_valid_now(sim.player, w):
			if w["kind"] == "mortar":
				note = "needs Long/Medium range"
			elif w["ammo"] == "grape":
				note = "needs Close range"
			elif w["ammo"] == "heated":
				note = "needs the furnace lit"
			else:
				note = "no firing solution"
		elif sim.station_eff(sim.player, w["station"]) <= 0.0:
			note = "nobody manning it"
		else:
			note = D.AMMO_HINTS.get(w["ammo"], "")
		ww["note"].text = note
	furnace_btn.button_pressed = sim.player["furnace_intent"]
	furnace_btn.text = "FURNACE HOT" if sim.player["furnace_lit"] else "LIGHT FURNACE"
	var t: String = sim.player["target_station"]
	if t != "" and sim.enemy["stations"].has(t):
		target_label.text = "Target: %s" % sim.enemy["stations"][t]["label"]
	else:
		target_label.text = "Target: hull (tap an enemy station)"


func _refresh_actions() -> void:
	for stance in stance_btns:
		stance_btns[stance].button_pressed = sim.player["stance"] == stance
	var grappled: bool = sim.battle["grappled"]
	var at_close := sim.band() == 2
	action_btns["grapple"].visible = at_close and not grappled
	action_btns["grapple"].button_pressed = sim.player["grapple_intent"]
	action_btns["cut"].visible = grappled
	action_btns["cut"].button_pressed = sim.player["cut_intent"]
	action_btns["board"].visible = grappled and sim.boarders_of(sim.player).is_empty()
	action_btns["recall"].visible = grappled and not sim.boarders_of(sim.player).is_empty()


func _post_mortem() -> String:
	match sim.battle["outcome"]:
		"destroyed_enemy":
			if sim.enemy["behavior"] == "flee":
				return "Tip: a sunken merchant pays nothing. Chain shot her sails, then force a surrender or board her."
			return "Tip: sinking works — but surrendered and captured prizes pay far better."
		"escape_enemy":
			return "Tip: chain shot shreds sails. A dismasted ship cannot run."
		"captured_enemy":
			return "Tip: your muster deck was thin. Man the swivels and keep brutes at muster to repel boarders."
		"destroyed_player", "crew_wiped_player":
			return "Tip: watch the fight paused. Fires climb upward, water rises from below — pull hands off guns before the ship is lost."
	return "Every defeat teaches. Every victory pays."
