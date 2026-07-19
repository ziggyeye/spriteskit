## Harbor menu: pick an engagement, sail, return here when it ends.
extends Control

const D := preload("res://src/defs.gd")
const BattleViewScript := preload("res://src/battle_view.gd")

var menu: Control


func _ready() -> void:
	_show_menu()


func _show_menu() -> void:
	menu = Control.new()
	menu.set_anchors_preset(Control.PRESET_FULL_RECT)
	var th := Theme.new()
	th.default_font_size = 26
	menu.theme = th

	var bg := ColorRect.new()
	bg.color = Color(0.07, 0.08, 0.11)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	menu.add_child(bg)

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 22)
	vb.custom_minimum_size = Vector2(880, 0)

	var title := Label.new()
	title.text = "DEAD RECKONING"
	title.add_theme_font_size_override("font_size", 72)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(title)

	var sub := Label.new()
	sub.text = "M1 combat grey-box — one ship, three fights, no mercy"
	sub.add_theme_font_size_override("font_size", 26)
	sub.add_theme_color_override("font_color", Color(0.6, 0.62, 0.68))
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(sub)

	for enemy_id in D.enemy_ids():
		var def := D.enemy_ship(enemy_id)
		var btn := Button.new()
		btn.text = "%s — %s" % [def["title"], def["name"]]
		btn.add_theme_font_size_override("font_size", 32)
		btn.pressed.connect(_start_battle.bind(enemy_id))
		vb.add_child(btn)
		var blurb := Label.new()
		blurb.text = def["blurb"]
		blurb.add_theme_font_size_override("font_size", 21)
		blurb.add_theme_color_override("font_color", Color(0.6, 0.62, 0.68))
		blurb.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vb.add_child(blurb)

	var help := Label.new()
	help.text = "Tap a crewman, then a station, to move them. Idle hands fight fires and plug leaks. Tap an enemy station to aim at it. PAUSE any time — the fight waits for your orders."
	help.add_theme_font_size_override("font_size", 21)
	help.add_theme_color_override("font_color", Color(0.5, 0.52, 0.58))
	help.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(help)

	center.add_child(vb)
	menu.add_child(center)
	add_child(menu)


func _start_battle(enemy_id: String) -> void:
	menu.queue_free()
	var battle := BattleViewScript.new(enemy_id)
	battle.finished.connect(func():
		battle.queue_free()
		_show_menu()
	)
	add_child(battle)
