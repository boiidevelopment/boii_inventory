--- Main 
--- @script client/main.lua

--- @section Constants

local BLOCKED_VEHICLE_CLASSES = {
    ['Cycles'] = true
}

--- @section Local functions

--- Get player inventory data from the server
local function get_player_inventory(callback)
    utils.callback.cb('boii_inventory:sv:get_player_inventory', nil, function(inventory_data, message)
        if inventory_data then
            callback(inventory_data)

            print('inventory data:', json.encode(inventory_data))
        else
            print('Failed to retrieve player inventory:', message)
            callback(nil)
        end
    end)
end
exports('get_player_inventory', get_player_inventory)

--- Get vehicle inventory data from the server
local function get_vehicle_inventory(inventory_type, vehicle_data, callback)
    utils.callback.cb('boii_inventory:sv:get_vehicle_inventory', { type = inventory_type, class = string.lower(vehicle_data.class), plate = vehicle_data.plate }, function(inventory_data, message)
        if inventory_data then
            callback(inventory_data)
        else
            print('Failed to retrieve vehicle inventory:', message)
            callback(nil)
        end
    end)
end
exports('get_vehicle_inventory', get_vehicle_inventory)

--- Find an item by its slot position.
local function find_item_by_slot(slot)
    local player_items = player_inventory.items
    for _, item in pairs(player_items) do
        if item.slot == slot then
            return item
        end
    end
    return nil
end
exports('find_item_by_slot', find_item_by_slot)

--- Send inventory data to UI
local function send_inventory_data(inventory_type, player_inventory, other_inventory)
    local inventory_data = {
        type = inventory_type,
        player_inventory = player_inventory,
        other_inventory = other_inventory
    }
    SendNUIMessage({
        action = 'open_inventory',
        data = inventory_data
    })
    SetNuiFocus(true, true)
    is_inventory_open = true
    if other_inventory and other_inventory.type == 'trunk' then
        is_trunk_open = true
    end
end

--- Open inventory
local function open_inventory()
    if is_inventory_open then 
        print('Inventory is already open.') 
        return 
    end
    local player = PlayerPedId()
    local vehicle_data = utils.vehicles.get_vehicle_details(false)
    get_player_inventory(function(player_inventory)
        if not player_inventory then
            return
        end
        if IsPedInAnyVehicle(player, false) then
            vehicle_data = utils.vehicles.get_vehicle_details(true)
            if vehicle_data and not BLOCKED_VEHICLE_CLASSES[vehicle_data.class] then
                get_vehicle_inventory('glovebox', vehicle_data, function(other_inventory)
                    send_inventory_data(player_inventory.type, player_inventory, other_inventory)
                end)
            else
                send_inventory_data(player_inventory.type, player_inventory, nil)
            end
        elseif vehicle_data and vehicle_data.distance <= 2.0 then
            if not BLOCKED_VEHICLE_CLASSES[vehicle_data.class] then
                get_vehicle_inventory('trunk', vehicle_data, function(other_inventory)
                    local door_index = vehicle_data.is_rear_engine and 4 or 5
                    SetVehicleDoorOpen(vehicle_data.vehicle, door_index, false, false)
                    send_inventory_data(player_inventory.type, player_inventory, other_inventory)
                end)
            else
                send_inventory_data(player_inventory.type, player_inventory, nil)
            end
        else
            send_inventory_data(player_inventory.type, player_inventory, nil)
        end
    end)
end
exports('open_inventory', open_inventory)

local function close_inventory()
    is_inventory_open = false
    SetNuiFocus(false, false)
    if is_trunk_open then
        local vehicle_data = utils.vehicles.get_vehicle_details(false)
        if not vehicle_data then print('no vehicle nearby') return end
        local door_index = vehicle_data.is_rear_engine and 4 or 5
        SetVehicleDoorShut(vehicle_data.vehicle, door_index, false)
        is_trunk_open = false
    end
end

--- @section NUI callbacks

--- Close inventory
RegisterNUICallback('close_inventory', function()
    close_inventory()
end)

--- Save inventory state
RegisterNUICallback('save_inventory', function(data, cb)
    local inventory_state = data
    utils.callback.cb('boii_inventory:sv:save_inventories', inventory_state, function(success, message)
        if not success then
            print('Error saving inventory: ' .. message)
        end
    end)
    cb('ok')
end)

--- Callback to use an item
RegisterNUICallback('use_item', function(data, cb)
    close_inventory()
    TriggerServerEvent('boii_utils:sv:use_item', data.item_id)
end)

--- Callback to drop an item
RegisterNUICallback('drop_item', function(data, cb)
    close_inventory()
    TriggerServerEvent('boii_items:sv:drop', { item = data.item_id, amount = data.quantity })
end)


--- @section Events

--- Show item boxes when items are used removed added etc
RegisterNetEvent('boii_inventory:cl:show_item_box', function(action_id, item_id, amount)
    local found_item = exports.boii_items:find_item(item_id)
    if not found_item then 
        debug_log('err', 'Event: boii_inventory:cl:show_item_box | Note: Failed to find item: ' .. item_id) 
        return 
    end
    SendNUIMessage({
        action = 'display_item_box',
        data = {
            action = action_id,
            item = {
                image = found_item.image,
                quantity = amount
            }
        }
    })
end)

--- @section Keymapping

--- Open inventory command
RegisterKeyMapping('inventory', 'Open Inventory (ESC to close)', 'keyboard', 'TAB')
RegisterCommand('inventory', function()
    if not is_inventory_open then
        open_inventory()
    end
end)

for i = 1, 6 do
    RegisterKeyMapping('slot_' .. i, 'Use hotbar slot: ' .. i, 'keyboard', tostring(i))
    RegisterCommand('slot_' .. i, function()
        local item = find_item_by_slot(i)
        local item_data = exports.boii_items:find_item(item.item_id)
        if item and item_data then
            close_inventory()
            TriggerServerEvent('boii_utils:sv:use_item', item.item_id)
            SendNUIMessage({
                action = 'display_item_box',
                data = {
                    action = 'use',
                    item = {
                        image = item_data.image,
                        quantity = 1
                    }
                }
            })
        else
            print('No item in this slot.')
        end
    end)
end