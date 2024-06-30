--- Commands
--- @script client/scripts/commands.lua

RegisterCommand('inv:client_data', function()
    local player_data = get_data()
    if not player_data then print('no player data found') return end

    print('player_data: ' .. json.encode(player_data))
end)

RegisterCommand('inv:client_other_data', function()
    print('other invents: ' .. json.encode(other_inventories))
end)