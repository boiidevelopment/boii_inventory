--- Client initialization
--- @script client/init.lua

--- @section Dependencies

--- Import utility library.
utils = exports.boii_utils:get_utils()

--- @section Tables

player_inventory = player_inventory or {}

other_inventories = {
    glovebox = {},
    trunk = {}
}

--- @section Global variables

is_inventory_open = false
is_trunk_open = false

--- @section Global functions

--- Gets inventory data for player.
function get_data(key)
    if key then
        return player_inventory[key]
    else
        return player_inventory
    end
end

--- @section Local functions

--- Sets incoming data to player data.
local function set_data(data)
    player_inventory = data
end

--- Sets a other inventory synced for all clients.
local function set_other_data(type, id, data)
    other_inventories[type][id] = data
end

--- @section Events

--- Sets player object data client side.
RegisterNetEvent('boii_inventory:cl:set_data', function(data)
    if not data then 
        print('Event: boii_inventory:cl:set_data failed. | Reason: Data is missing.')
    end
    set_data(data)
end)

--- Sets other inventory data.
RegisterNetEvent('boii_inventory:cl:set_other_data', function(type, id, data)
    if not type or not id or not data then 
        print('Event: boii_inventory:cl:set_other_data failed. | Reason: Missing parameters.')
        return
    end
    set_other_data(type, id, data)
end)
