gg_rct_Boss_Spawn = nil
gg_rct_FightStart = nil
gg_rct_PlayerOneSpawn = nil
gg_rct_StatueNE = nil
gg_rct_StatueNW = nil
gg_rct_StatueSE = nil
gg_rct_StatueSW = nil
gg_rct_PlayerTwoSpawn = nil
gg_trg_Untitled_Trigger_001 = nil
function InitGlobals()
end

function CreateRegions()
    local we
    gg_rct_Boss_Spawn = Rect(-512.0, -512.0, 512.0, 512.0)
    gg_rct_FightStart = Rect(-576.0, -1536.0, 416.0, -1056.0)
    gg_rct_PlayerOneSpawn = Rect(224.0, -5216.0, 480.0, -4960.0)
    gg_rct_StatueNE = Rect(1472.0, 1568.0, 1664.0, 1760.0)
    gg_rct_StatueNW = Rect(-1632.0, 1408.0, -1440.0, 1600.0)
    gg_rct_StatueSE = Rect(1472.0, -1760.0, 1696.0, -1536.0)
    gg_rct_StatueSW = Rect(-1728.0, -1728.0, -1536.0, -1536.0)
    gg_rct_PlayerTwoSpawn = Rect(416.0, -4864.0, 672.0, -4608.0)
end

--
function Trig_Untitled_Trigger_001_Actions()
    CreateNUnitsAtLoc(1, FourCC("e001"), Player(0), GetRectCenter(GetPlayableMapRect()), bj_UNIT_FACING)
    IssueImmediateOrderBJ(GetLastCreatedUnit(), "unroot")
    AddLightningLoc("HWPB", GetUnitLoc(GetTriggerUnit()), GetRectCenter(GetPlayableMapRect()))
end

function InitTrig_Untitled_Trigger_001()
    gg_trg_Untitled_Trigger_001 = CreateTrigger()
    TriggerAddAction(gg_trg_Untitled_Trigger_001, Trig_Untitled_Trigger_001_Actions)
end

function InitCustomTriggers()
    InitTrig_Untitled_Trigger_001()
end

function InitCustomPlayerSlots()
    SetPlayerStartLocation(Player(0), 0)
    ForcePlayerStartLocation(Player(0), 0)
    SetPlayerColor(Player(0), ConvertPlayerColor(0))
    SetPlayerRacePreference(Player(0), RACE_PREF_UNDEAD)
    SetPlayerRaceSelectable(Player(0), false)
    SetPlayerController(Player(0), MAP_CONTROL_USER)
    SetPlayerStartLocation(Player(1), 1)
    ForcePlayerStartLocation(Player(1), 1)
    SetPlayerColor(Player(1), ConvertPlayerColor(1))
    SetPlayerRacePreference(Player(1), RACE_PREF_UNDEAD)
    SetPlayerRaceSelectable(Player(1), false)
    SetPlayerController(Player(1), MAP_CONTROL_USER)
    SetPlayerStartLocation(Player(10), 2)
    ForcePlayerStartLocation(Player(10), 2)
    SetPlayerColor(Player(10), ConvertPlayerColor(10))
    SetPlayerRacePreference(Player(10), RACE_PREF_UNDEAD)
    SetPlayerRaceSelectable(Player(10), false)
    SetPlayerController(Player(10), MAP_CONTROL_COMPUTER)
end

function InitCustomTeams()
    SetPlayerTeam(Player(0), 0)
    SetPlayerTeam(Player(1), 0)
    SetPlayerAllianceStateAllyBJ(Player(0), Player(1), true)
    SetPlayerAllianceStateAllyBJ(Player(1), Player(0), true)
    SetPlayerAllianceStateVisionBJ(Player(0), Player(1), true)
    SetPlayerAllianceStateVisionBJ(Player(1), Player(0), true)
    SetPlayerTeam(Player(10), 1)
end

function InitAllyPriorities()
    SetStartLocPrioCount(0, 1)
    SetStartLocPrio(0, 0, 1, MAP_LOC_PRIO_HIGH)
    SetStartLocPrioCount(1, 1)
    SetStartLocPrio(1, 0, 0, MAP_LOC_PRIO_HIGH)
    SetStartLocPrioCount(2, 1)
    SetStartLocPrio(2, 0, 0, MAP_LOC_PRIO_HIGH)
end

function main()
    SetCameraBounds(-5376.0 + GetCameraMargin(CAMERA_MARGIN_LEFT), -5632.0 + GetCameraMargin(CAMERA_MARGIN_BOTTOM), 5376.0 - GetCameraMargin(CAMERA_MARGIN_RIGHT), 5120.0 - GetCameraMargin(CAMERA_MARGIN_TOP), -5376.0 + GetCameraMargin(CAMERA_MARGIN_LEFT), 5120.0 - GetCameraMargin(CAMERA_MARGIN_TOP), 5376.0 - GetCameraMargin(CAMERA_MARGIN_RIGHT), -5632.0 + GetCameraMargin(CAMERA_MARGIN_BOTTOM))
    SetDayNightModels("Environment\\DNC\\DNCAshenvale\\DNCAshenvaleTerrain\\DNCAshenvaleTerrain.mdl", "Environment\\DNC\\DNCAshenvale\\DNCAshenvaleUnit\\DNCAshenvaleUnit.mdl")
    SetWaterBaseColor(144, 144, 255, 255)
    NewSoundEnvironment("Default")
    SetAmbientDaySound("AshenvaleDay")
    SetAmbientNightSound("AshenvaleNight")
    SetMapMusic("Music", true, 0)
    CreateRegions()
    InitBlizzard()
    InitGlobals()
    InitCustomTriggers()
end

function config()
    SetMapName("TRIGSTR_001")
    SetMapDescription("TRIGSTR_003")
    SetPlayers(3)
    SetTeams(3)
    SetGamePlacement(MAP_PLACEMENT_TEAMS_TOGETHER)
    DefineStartLocation(0, 320.0, -4736.0)
    DefineStartLocation(1, 192.0, -5120.0)
    DefineStartLocation(2, 0.0, 0.0)
    InitCustomPlayerSlots()
    InitCustomTeams()
    InitAllyPriorities()
end

