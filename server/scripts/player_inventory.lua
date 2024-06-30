--- Player Inventory Object
--- @script server/scripts/player_object.lua

--- @section Queries

local SELECT_INVENTORY = 'SELECT * FROM player_inventories WHERE player = ?'
local INSERT_INVENTORY = 'INSERT INTO player_inventories (player, max_slots, grid_columns, grid_rows, carry_weight, current_weight, items) VALUES (?, ?, ?, ?, ?, ?, ?)'
local UPDATE_INVENTORY = 'UPDATE player_inventories SET %s WHERE player = ?'

--- @section Defaults

local DEFAULT_PLAYER_INVENTORY = {
    max_slots = 36,
    grid_columns = 10,
    grid_rows = 10,
    carry_weight = 80000,
    current_weight = 0,
    items = {}
}

--- @section Constants

local USE_MULTICHAR = true

--- @section Object initialization

--- Initialize the players inventory.
local function init(_src)
    local player_id
    if USE_MULTICHAR then
        player_id = utils.fw.get_player_id(_src)
    else
        player_id = utils.connections.get_user(_src).unique_id
    end
    local result = MySQL.query.await(SELECT_INVENTORY, { player_id })
    if result and #result > 0 then
        local player_data = result[1]
        local data = {
            max_slots = player_data.max_slots,
            grid_columns = player_data.grid_columns,
            grid_rows = player_data.grid_rows,
            carry_weight = player_data.carry_weight,
            current_weight = player_data.current_weight,
            items = json.decode(player_data.items)
        }
        create_inventory(_src, player_id, data)
    else
        MySQL.query.await(INSERT_INVENTORY, {
            player_id,
            DEFAULT_PLAYER_INVENTORY.max_slots,
            DEFAULT_PLAYER_INVENTORY.grid_columns,
            DEFAULT_PLAYER_INVENTORY.grid_rows,
            DEFAULT_PLAYER_INVENTORY.carry_weight,
            DEFAULT_PLAYER_INVENTORY.current_weight,
            json.encode(DEFAULT_PLAYER_INVENTORY.items)
        })
        create_inventory(_src, player_id, DEFAULT_PLAYER_INVENTORY)
    end
end
exports('init', init)

--- @section Inventory object

function create_inventory(_src, player_id, data)

    local function create()
        if not _src or not player_id or not data then 
            print('Inventory Method: create_inventory | Note: Missing parameters') 
            return 
        end

        print('Inventory Method: create_inventory | Note: Creating inventory object for player ' .. _src)

        local self = {}
        self.source = _src
        self.player_id = player_id
        self.data = data or {}

        --- Return the entire player inventory.
        function self.get_inventory()
            return self.data
        end

        --- Return the players current items
        function self.get_items()
            return self.data.items
        end

        --- Return a specific item.
        function self.get_item(item_name)
            for _, item in pairs(self.data.items) do
                if item.item_id == item_name then
                    return item
                end
            end
            return nil
        end

        --- Return if player has required item and quantity.
        function self.has_item(item_name, quantity)
            local required_amount = quantity or 1
            local item = self.get_item(item_name)
            return item ~= nil and item.quantity >= required_amount
        end

        --- Modify a player's inventory
        function self.modify_inventory(items, reason, should_save)
            local save = should_save or false
            for _, item in ipairs(items) do
                local item_id = item.item_id
                local item_data = exports.boii_items:find_item(item_id)
                if not item_data then
                    print('Attempted to modify inventory with invalid item ID: ' .. item_id)
                    return false
                end
                local action = item.action
                local quantity = item.quantity
                local data = item.data or item_data.data or {}
                local weight = item_data.weight
                if action == 'add' then
                    if self.data.current_weight + weight * quantity > self.data.carry_weight then
                        print('Inventory Method: modify_inventory | Note: Carry weight limit exceeded')
                        return false
                    end
                    local slot = find_next_available_slot(self.data.items, self.data.max_slots)
                    local grid_position = find_next_available_grid_position(self.data.items, self.data.grid_columns, self.data.grid_rows, item_data.grid.width, item_data.grid.height)
                    if not slot or not grid_position then
                        print('Inventory Method: modify_inventory | Note: No available slot or grid position for item')
                        return false
                    end
                    item.slot = slot
                    item.grid = grid_position
                    item.data = data
                    item.action = nil
                    self.data.items[#self.data.items + 1] = item
                    self.data.current_weight = self.data.current_weight + weight * quantity
                    TriggerClientEvent('boii_inventory:cl:show_item_box', self.source, 'add', item_id, quantity)
                    print('Inventory Method: modify_inventory | Note: Item added to inventory')
                elseif action == 'remove' then
                    local found = false
                    for i, inv_item in ipairs(self.data.items) do
                        if inv_item.item_id == item_id then
                            if inv_item.quantity < quantity then
                                print('Inventory Method: modify_inventory | Note: Not enough quantity to remove')
                                return false
                            end
                            inv_item.quantity = inv_item.quantity - quantity
                            self.data.current_weight = self.data.current_weight - weight * quantity
                            if inv_item.quantity <= 0 then
                                table.remove(self.data.items, i)
                            end
                            found = true
                            TriggerClientEvent('boii_inventory:cl:show_item_box', self.source, 'remove', item_id, quantity)
                            print('Inventory Method: modify_inventory | Note: Item removed from inventory')
                            break
                        end
                    end
                    if not found then
                        print('Inventory Method: modify_inventory | Note: Item not found in inventory')
                        return false
                    end
                else
                    print('Invalid action type provided for item ' .. item_id)
                    return false
                end
            end
            self.set_data({ 'items', 'current_weight' }, save)
            print('Inventory modification completed for player ' .. self.source)
            return true
        end

        --- Set and sync data back to client.
        function self.set_data(data_types, save_to_db)
            data_types = data_types and #data_types > 0 and data_types or {'max_slots', 'grid_columns', 'grid_rows', 'carry_weight',  'current_weight', 'items'}
            local data_table = {}
            for _, data_type in ipairs(data_types) do
                data_table[data_type] = self.data[data_type] or DEFAULT_PLAYER_INVENTORY[data_type]
                if not data_table[data_type] then
                    print('Inventory Method: set_data | Note: Data type ' .. data_type .. ' not found in player data and no default available.')
                end
            end
            TriggerClientEvent('boii_inventory:cl:set_data', self.source, data_table)
            if save_to_db then
                self.save_data(data_types)
            end
        end

        --- Save the inventory to database.
        function self.save_data(data_types)
            data_types = data_types and #data_types > 0 and data_types or {'max_slots', 'grid_columns', 'grid_rows', 'carry_weight',  'current_weight', 'items'}
            local params, fields, idx = {}, {}, 1
            for _, field in ipairs(data_types) do
                if self.data[field] then
                    params[idx], fields[idx], idx = json.encode(self.data[field]), field .. ' = ?', idx + 1
                end
            end
            if #fields > 0 then
                params[idx] = self.player_id
                MySQL.Async.execute(string.format(UPDATE_INVENTORY, table.concat(fields, ', ')), params)
            end
        end

        self.set_data({}, true)
        player_inventories[self.source] = self
        print('Inventory Method: create_inventory | Note: Finished creating inventory object for source: ' .. _src)
        return self
    end

    return utils.debug.try_catch(create, function(err) print('Inventory Method: create_inventory | Note: Error occurred during player creation: ' .. err) end)
end