## Static content definitions: ships, stations, crew, weapons.
## Everything is plain Dictionaries so the sim stays engine-agnostic and
## trivially serializable (mid-battle save/resume is a launch requirement).
class_name Defs

const TICK := 0.1

const DECKS := ["weather", "gun", "hold"]

const BAND_NAMES := ["LONG RANGE", "MEDIUM RANGE", "CLOSE RANGE", "GRAPPLED"]

const AMMO_TYPES := ["round", "chain", "grape", "heated"]

const AMMO_LABELS := {
	"round": "Round shot",
	"chain": "Chain shot",
	"grape": "Grapeshot",
	"heated": "Heated shot",
	"mortar": "Mortar shell",
}

const AMMO_HINTS := {
	"round": "Hull + subsystems. Sinks ships (and their loot).",
	"chain": "Shreds sails. Stops runners, strips evasion.",
	"grape": "Kills exposed crew. Close range only.",
	"heated": "Starts fires. Needs the galley furnace lit.",
	"mortar": "Siege arcs. Only hits slow or dismasted targets.",
}

const ROLE_COLORS := {
	"Gunner": Color(0.85, 0.45, 0.35),
	"Rigger": Color(0.4, 0.7, 0.9),
	"Carpenter": Color(0.8, 0.65, 0.4),
	"Surgeon": Color(0.5, 0.85, 0.55),
	"Brute": Color(0.75, 0.5, 0.8),
	"Deckhand": Color(0.65, 0.65, 0.65),
}

## Melee attack strength per role (boarding actions).
const ROLE_ATK := {
	"Brute": 2.6,
	"Gunner": 1.5,
	"Deckhand": 1.3,
	"Rigger": 1.2,
	"Carpenter": 1.2,
	"Surgeon": 0.9,
}

## Which station kind each role is best at (grants +0.5 effectiveness).
const ROLE_STATION := {
	"Gunner": ["battery", "mortar", "swivel"],
	"Rigger": ["helm"],
	"Carpenter": ["pumps"],
	"Surgeon": ["sickbay"],
	"Brute": ["muster"],
	"Deckhand": [],
}


static func _station(label: String, deck: String, slots: int, hp: float, kind: String) -> Dictionary:
	return {
		"label": label, "deck": deck, "slots": slots,
		"hp": hp, "hp_max": hp, "kind": kind,
	}


static func _crew(cname: String, role: String, hp := 10.0) -> Dictionary:
	return {
		"name": cname, "role": role, "hp": hp, "hp_max": hp,
		"alive": true, "station": "", "aboard": "own",
	}


static func _battery(reload: float, power := 1.0) -> Dictionary:
	return {
		"id": "battery", "label": "Broadside", "kind": "battery",
		"station": "cannons", "reload": reload, "timer": 0.0,
		"ammo": "round", "hold_fire": false, "power": power,
	}


static func _mortar(reload := 11.0) -> Dictionary:
	return {
		"id": "mortar", "label": "Mortar", "kind": "mortar",
		"station": "mortar_mt", "reload": reload, "timer": 0.0,
		"ammo": "mortar", "hold_fire": true, "power": 1.0,
	}


static func player_ship() -> Dictionary:
	return {
		"name": "Reckless",
		"side": "player",
		"hull": 26.0, "hull_max": 26.0,
		"sails": 12.0, "sails_max": 12.0,
		"speed": 1.0,
		"resolve": 999.0, "resolve_max": 999.0,
		"can_surrender": false,
		"behavior": "player",
		"stations": {
			"helm": _station("Helm", "weather", 1, 6.0, "helm"),
			"swivels": _station("Swivels", "weather", 1, 5.0, "swivel"),
			"muster": _station("Muster Deck", "weather", 4, 7.0, "muster"),
			"cannons": _station("Cannon Battery", "gun", 3, 8.0, "battery"),
			"mortar_mt": _station("Mortar", "gun", 1, 6.0, "mortar"),
			"pumps": _station("Bilge Pumps", "hold", 2, 6.0, "pumps"),
			"galley": _station("Galley Furnace", "hold", 1, 5.0, "furnace"),
			"magazine": _station("Powder Magazine", "hold", 0, 5.0, "magazine"),
			"sickbay": _station("Sickbay", "hold", 1, 6.0, "sickbay"),
		},
		"crew": [
			_crew("Okoro", "Gunner"),
			_crew("Finch", "Gunner"),
			_crew("Maeve", "Rigger"),
			_crew("Tam", "Carpenter"),
			_crew("Ibarra", "Surgeon"),
			_crew("Guld", "Brute", 13.0),
		],
		"start_posts": {
			"Okoro": "cannons", "Finch": "cannons", "Maeve": "helm",
			"Ibarra": "sickbay", "Guld": "muster", "Tam": "",
		},
		"weapons": [_battery(6.0), _mortar()],
		"ammo": {"round": 20, "chain": 12, "grape": 10, "heated": 8, "mortar": 6},
	}


static func enemy_ids() -> Array:
	return ["merchant_brig", "navy_sloop", "navy_frigate"]


static func enemy_ship(id: String) -> Dictionary:
	match id:
		"merchant_brig":
			return {
				"name": "Fat Cygnet",
				"side": "enemy",
				"title": "Merchant Brig",
				"blurb": "Heavy with cargo and desperate to run. Sink her and the prize sinks too — chain shot her sails, then take her.",
				"hull": 20.0, "hull_max": 20.0,
				"sails": 10.0, "sails_max": 10.0,
				"speed": 1.05,
				"resolve": 55.0, "resolve_max": 55.0,
				"can_surrender": true,
				"behavior": "flee",
				"stations": {
					"helm": _station("Helm", "weather", 1, 5.0, "helm"),
					"muster": _station("Muster Deck", "weather", 3, 6.0, "muster"),
					"cannons": _station("Stern Chasers", "gun", 2, 6.0, "battery"),
					"pumps": _station("Bilge Pumps", "hold", 1, 5.0, "pumps"),
					"cargo": _station("Cargo Hold", "hold", 0, 6.0, "cargo"),
				},
				"crew": [
					_crew("Sorrel", "Rigger"),
					_crew("Pell", "Gunner"),
					_crew("Aldo", "Deckhand"),
					_crew("Brix", "Deckhand"),
				],
				"start_posts": {"Sorrel": "helm", "Pell": "cannons", "Aldo": "pumps", "Brix": "muster"},
				"weapons": [_battery(8.0, 0.8)],
				"ammo": {"round": 8, "chain": 0, "grape": 0, "heated": 0, "mortar": 0},
			}
		"navy_sloop":
			return {
				"name": "HMS Vigilant",
				"side": "enemy",
				"title": "Navy Sloop",
				"blurb": "Fast, upwind, and full of marines — she means to grapple and board you. Grape her exposed crew, man your swivels, hold the muster deck.",
				"hull": 22.0, "hull_max": 22.0,
				"sails": 14.0, "sails_max": 14.0,
				"speed": 1.25,
				"resolve": 90.0, "resolve_max": 90.0,
				"can_surrender": true,
				"behavior": "close_board",
				"stations": {
					"helm": _station("Helm", "weather", 1, 5.0, "helm"),
					"swivels": _station("Swivels", "weather", 1, 5.0, "swivel"),
					"muster": _station("Muster Deck", "weather", 4, 6.0, "muster"),
					"cannons": _station("Cannon Battery", "gun", 2, 7.0, "battery"),
					"pumps": _station("Bilge Pumps", "hold", 1, 5.0, "pumps"),
					"magazine": _station("Powder Magazine", "hold", 0, 5.0, "magazine"),
				},
				"crew": [
					_crew("Ashworth", "Rigger"),
					_crew("Quill", "Gunner"),
					_crew("Dobbs", "Deckhand"),
					_crew("Sgt. Croft", "Brute", 13.0),
					_crew("Pvt. Nash", "Brute", 12.0),
					_crew("Webb", "Deckhand"),
				],
				"start_posts": {
					"Ashworth": "helm", "Quill": "cannons", "Dobbs": "pumps",
					"Sgt. Croft": "muster", "Pvt. Nash": "muster", "Webb": "swivels",
				},
				"weapons": [_battery(6.5, 0.9)],
				"ammo": {"round": 10, "chain": 0, "grape": 12, "heated": 0, "mortar": 0},
			}
		"navy_frigate":
			return {
				"name": "Sovereign's Wrath",
				"side": "enemy",
				"title": "Navy Frigate",
				"blurb": "Out-guns you three to one at medium range and her furnace is already smoking. Don't give her a fair fight — dismast her at long range or rush to grapple.",
				"hull": 40.0, "hull_max": 40.0,
				"sails": 12.0, "sails_max": 12.0,
				"speed": 0.9,
				"resolve": 120.0, "resolve_max": 120.0,
				"can_surrender": true,
				"behavior": "stand_off",
				"stations": {
					"helm": _station("Helm", "weather", 1, 6.0, "helm"),
					"swivels": _station("Swivels", "weather", 1, 5.0, "swivel"),
					"muster": _station("Muster Deck", "weather", 3, 7.0, "muster"),
					"cannons": _station("Gun Deck", "gun", 4, 10.0, "battery"),
					"pumps": _station("Bilge Pumps", "hold", 2, 6.0, "pumps"),
					"galley": _station("Galley Furnace", "hold", 1, 5.0, "furnace"),
					"magazine": _station("Powder Magazine", "hold", 0, 5.0, "magazine"),
				},
				"crew": [
					_crew("Ld. Fairwind", "Rigger"),
					_crew("Battle", "Gunner"),
					_crew("Moss", "Gunner"),
					_crew("Pryce", "Gunner"),
					_crew("Hale", "Deckhand"),
					_crew("Cpl. Iron", "Brute", 13.0),
					_crew("Sparks", "Deckhand"),
					_crew("Wright", "Carpenter"),
				],
				"start_posts": {
					"Ld. Fairwind": "helm", "Battle": "cannons", "Moss": "cannons",
					"Pryce": "cannons", "Hale": "pumps", "Cpl. Iron": "muster",
					"Sparks": "swivels", "Wright": "",
				},
				"weapons": [_battery(7.5, 1.5)],
				"ammo": {"round": 30, "chain": 12, "grape": 0, "heated": 8, "mortar": 0},
			}
	push_error("Unknown enemy id: " + id)
	return {}
