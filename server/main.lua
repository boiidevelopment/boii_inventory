--- @section Global functions

--- Get a players inventory
function get_player_inventory(_src)
    local player = get_player(_src)
    if not player then print('Player missing.') return false end
    local inventory = player.get_inventory()
    if not inventory then print('Inventory missing.') return false end
    local identity = utils.fw.get_identity(_src)
    if not identity then print('Identity missing.') return false end
    local items = {}
    for _, item in ipairs(inventory.items) do
        local item_data = exports.boii_items:find_item(item.item_id)
        if item_data then
            items[#items + 1] = {
                item_id = item.item_id,
                quantity = item.quantity,
                weight = item_data.weight,
                slot = item.slot,
                grid = item.grid,
                data = item.data or item_data.data,
                image = item_data.image,
                label = item_data.label,
                category = item_data.category,
                description = item_data.description
            }
        else
            print('Item data not found for item ID: ' .. item.item_id)
            return false
        end
    end
    local inventory_data = {
        type = config.inventory_type,
        name = identity.first_name .. ' ' .. identity.last_name,
        server_id = _src,
        max_slots = inventory.max_slots,
        grid_columns = inventory.grid_columns,
        grid_rows = inventory.grid_rows,
        carry_weight = inventory.carry_weight,
        current_weight = inventory.current_weight,
        items = items
    }
    return inventory_data
end

--- @section Local functions

--- Saves player inventory.
local function save_player_inventory(player_id, inventory)
    local player = get_player(player_id)
    if player then
        player.data.items = inventory.items
        player.data.current_weight = inventory.current_weight
        player.data.carry_weight = inventory.carry_weight
        player.data.max_slots = inventory.max_slots
        player.set_data({ 'carry_weight', 'max_slots', 'current_weight', 'items' }, true)
    else
        print('Player not found: ' .. player_id)
    end
end

--- Saves other inventory.
local function save_other_inventory(type, id, inventory)
    other_inventories[type][id] = inventory
    TriggerClientEvent('boii_inventory:cl:set_other_data', -1, type, inventory.plate, inventory)
end

--- Modify the player's inventory.
local function modify_inventory(_src, items, reason, save)
    local player = get_player(_src)
    if not player then 
        print('no player found') 
        return 
    end

    player.modify_inventory(items, reason, save)
end
exports('modify_inventory', modify_inventory)

--- Get a player's inventory.
local function get_inventory(_src)
    local player = get_player(_src)
    if not player then 
        print('no player found') 
        return 
    end
    local inventory = player.get_inventory()
    if not inventory then 
        print('inventory not found') 
        return 
    end
    return inventory
end
exports('get_inventory', get_inventory)

--- Get a specific item from a player's inventory.
local function get_item(_src, item_name)
    local player = get_player(_src)
    if not player then 
        print('no player found') 
        return false 
    end
    local item = player.get_item(item_name)
    if not item then 
        print('item not found') 
        return false 
    end
    return item
end
exports('get_item', get_item)

--- Check if a player has a specific item.
local function has_item(_src, item_name, item_amount)
    local player = get_player(_src)
    if not player then 
        print('no player found') 
        return false 
    end
    local required_amount = item_amount or 1
    return player.has_item(item_name, required_amount)
end
exports('has_item', has_item)

--- @section Callbacks

--- Callback player inventory data.
utils.callback.register('boii_inventory:sv:get_player_inventory', function(_src, data, cb)
    local player_inventory = get_player_inventory(_src)
    cb(player_inventory)
end)

--- Callback to save inventory
utils.callback.register('boii_inventory:sv:save_inventories', function(_src, data, cb)
    local player_inventory = data.player_inventory
    local other_inventory = data.other_inventory
    save_player_inventory(_src, player_inventory)
    if other_inventory then
        save_other_inventory(other_inventory.type, other_inventory.plate, other_inventory)
    end
    cb(true, 'Inventory saved successfully')
end)

--- @section Event handlers

--- Save inventory and remove table entry on player drop.
local function on_player_drop(reason)
    local _src = source
    local player = get_player(_src)
    if player then
        player.save_data({}, true)
        Wait(100)
        player_inventories[_src] = nil
    end
end
AddEventHandler('playerDropped', on_player_drop)