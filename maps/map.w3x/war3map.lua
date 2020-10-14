gg_rct_Boss_Spawn = nil
gg_rct_FightStart = nil
gg_rct_PlayerOneSpawn = nil
gg_rct_StatueNE = nil
gg_rct_StatueNW = nil
gg_rct_StatueSE = nil
gg_rct_StatueSW = nil
gg_rct_PlayerTwoSpawn = nil
gg_trg_Untitled_Trigger_001 = nil
gg_cam_Boss_Camera = nil
gg_rct_Rune00 = nil
gg_rct_Rune01 = nil
gg_rct_Rune02 = nil
gg_rct_Rune03 = nil
gg_rct_Rune04 = nil
gg_rct_Rune05 = nil
gg_rct_Rune06 = nil
gg_rct_Rune07 = nil
gg_rct_Rune08 = nil
gg_rct_Rune09 = nil
gg_rct_Rune10 = nil
gg_rct_Rune11 = nil
gg_rct_Rune12 = nil
gg_rct_Rune13 = nil
gg_rct_Rune14 = nil
gg_rct_Rune15 = nil
function InitGlobals()
end

function CreateRegions()
    local we
    gg_rct_Boss_Spawn = Rect(-512.0, -512.0, 512.0, 512.0)
    gg_rct_FightStart = Rect(-3232.0, -1568.0, 3072.0, -864.0)
    gg_rct_PlayerOneSpawn = Rect(224.0, -5216.0, 480.0, -4960.0)
    gg_rct_StatueNE = Rect(1472.0, 1568.0, 1664.0, 1760.0)
    gg_rct_StatueNW = Rect(-1632.0, 1408.0, -1440.0, 1600.0)
    gg_rct_StatueSE = Rect(1472.0, -1760.0, 1696.0, -1536.0)
    gg_rct_StatueSW = Rect(-1728.0, -1728.0, -1536.0, -1536.0)
    gg_rct_PlayerTwoSpawn = Rect(416.0, -4864.0, 672.0, -4608.0)
    gg_rct_Rune00 = Rect(-2272.0, -1120.0, -2144.0, -992.0)
    gg_rct_Rune01 = Rect(-1056.0, -3712.0, -928.0, -3584.0)
    gg_rct_Rune02 = Rect(-2848.0, -3232.0, -2720.0, -3104.0)
    gg_rct_Rune03 = Rect(-1408.0, -2240.0, -1280.0, -2112.0)
    gg_rct_Rune04 = Rect(928.0, -3200.0, 1056.0, -3072.0)
    gg_rct_Rune05 = Rect(2592.0, -2208.0, 2720.0, -2080.0)
    gg_rct_Rune06 = Rect(896.0, -1920.0, 1056.0, -1792.0)
    gg_rct_Rune07 = Rect(2400.0, -1056.0, 2528.0, -928.0)
    gg_rct_Rune08 = Rect(1888.0, 480.0, 2016.0, 608.0)
    gg_rct_Rune09 = Rect(1408.0, 2144.0, 1536.0, 2272.0)
    gg_rct_Rune10 = Rect(2528.0, 1888.0, 2656.0, 2016.0)
    gg_rct_Rune11 = Rect(544.0, 2432.0, 672.0, 2560.0)
    gg_rct_Rune12 = Rect(-384.0, 2048.0, -256.0, 2176.0)
    gg_rct_Rune13 = Rect(-2752.0, 1088.0, -2624.0, 1248.0)
    gg_rct_Rune14 = Rect(-1472.0, 2144.0, -1344.0, 2272.0)
    gg_rct_Rune15 = Rect(-2272.0, 320.0, -2144.0, 448.0)
end

function CreateCameras()
    gg_cam_Boss_Camera = CreateCameraSetup()
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_ZOFFSET, 0.0, 0.0)
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_ROTATION, 88.6, 0.0)
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_ANGLE_OF_ATTACK, 344.1, 0.0)
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_TARGET_DISTANCE, 2657.3, 0.0)
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_ROLL, 0.0, 0.0)
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_FIELD_OF_VIEW, 70.0, 0.0)
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_FARZ, 5000.0, 0.0)
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_NEARZ, 16.0, 0.0)
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_LOCAL_PITCH, 0.0, 0.0)
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_LOCAL_YAW, 0.0, 0.0)
    CameraSetupSetField(gg_cam_Boss_Camera, CAMERA_FIELD_LOCAL_ROLL, 0.0, 0.0)
    CameraSetupSetDestPosition(gg_cam_Boss_Camera, 104.5, 144.8, 0.0)
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
    SetPlayerRacePreference(Player(10), RACE_PREF_NIGHTELF)
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
    CreateCameras()
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

