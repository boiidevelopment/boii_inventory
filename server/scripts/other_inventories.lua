--- Other Inventories
--- @script server/scripts/other_inventories.lua

--- @section Constants

--- Vehicle defaults
local DEFAULT_VEHICLE_DATA = {
    compact = { glovebox_weight = 10000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 80000, trunk_slots = 10, trunk_grid = { rows = 6, columns = 6 } },
    sedan = { glovebox_weight = 15000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 120000, trunk_slots = 15, trunk_grid = { rows = 7, columns = 7 } },
    suv = { glovebox_weight = 20000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 150000, trunk_slots = 20, trunk_grid = { rows = 8, columns = 8 } },
    coupe = { glovebox_weight = 15000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 100000, trunk_slots = 12, trunk_grid = { rows = 6, columns = 6 } },
    muscle = { glovebox_weight = 15000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 120000, trunk_slots = 18, trunk_grid = { rows = 7, columns = 7 } },
    sports = { glovebox_weight = 20000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 100000, trunk_slots = 12, trunk_grid = { rows = 6, columns = 6 } },
    super = { glovebox_weight = 25000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 80000, trunk_slots = 10, trunk_grid = { rows = 5, columns = 5 } },
    motorcycle = { glovebox_weight = 10000, glovebox_slots = 6, glovebox_grid = { rows = 3, columns = 3 }, trunk_weight = 50000, trunk_slots = 6, trunk_grid = { rows = 4, columns = 4 } },
    offroad = { glovebox_weight = 20000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 150000, trunk_slots = 20, trunk_grid = { rows = 8, columns = 8 } },
    industrial = { glovebox_weight = 30000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 250000, trunk_slots = 24, trunk_grid = { rows = 9, columns = 9 } },
    utility = { glovebox_weight = 20000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 175000, trunk_slots = 18, trunk_grid = { rows = 7, columns = 7 } },
    van = { glovebox_weight = 25000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 200000, trunk_slots = 20, trunk_grid = { rows = 8, columns = 8 } },
    service = { glovebox_weight = 15000, glovebox_slots = 6, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 120000, trunk_slots = 16, trunk_grid = { rows = 7, columns = 7 } },
    emergency = { glovebox_weight = 20000, glovebox_slots = 8, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 150000, trunk_slots = 18, trunk_grid = { rows = 7, columns = 7 } },
    military = { glovebox_weight = 30000, glovebox_slots = 15, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 250000, trunk_slots = 30, trunk_grid = { rows = 10, columns = 10 } },
    commercial = { glovebox_weight = 25000, glovebox_slots = 12, glovebox_grid = { rows = 5, columns = 5 }, trunk_weight = 200000, trunk_slots = 24, trunk_grid = { rows = 9, columns = 9 } },
}

-- Function to get default vehicle data
local function get_default_vehicle_data(vehicle_class)
    return DEFAULT_VEHICLE_DATA[vehicle_class] or { glovebox_weight = 15000, glovebox_slots = 6, trunk_weight = 120000, trunk_slots = 28 }
end

--- Creates a "other inventory"
function create_other_inventory(type, id, data)
    other_inventories[type][id] = data or {
        items = {},
        carry_weight = 35000,
        current_weight = 0,
        max_slots = 12,
        grid_rows = 6,
        grid_columns = 6
    }
    print('Created other inventory: ' .. type .. ' with ID: ' .. id)
end

exports('create_other_inventory', create_other_inventory)

-- Callback to get vehicle inventory data
utils.callback.register('boii_inventory:sv:get_vehicle_inventory', function(_src, data, cb)
    local plate = data.plate
    local inventory_type = data.type
    local vehicle_class = data.class
    if not plate or not inventory_type or not vehicle_class then
        cb(nil, 'Vehicle plate, class or inventory type is missing.')
        return
    end
    local inventory = other_inventories[inventory_type][plate]
    if not inventory then
        local defaults = DEFAULT_VEHICLE_DATA[vehicle_class] or get_default_vehicle_data(vehicle_class)
        local default_data = {
            type = inventory_type,
            id = (inventory_type == 'glovebox' and 'GLOVEBOX - ' or 'TRUNK - ') .. plate,
            plate = plate,
            items = {},
            carry_weight = inventory_type == 'glovebox' and defaults.glovebox_weight or defaults.trunk_weight,
            current_weight = 0,
            max_slots = inventory_type == 'glovebox' and defaults.glovebox_slots or defaults.trunk_slots,
            grid_rows = inventory_type == 'glovebox' and defaults.glovebox_grid.rows or defaults.trunk_grid.rows,
            grid_columns = inventory_type == 'glovebox' and defaults.glovebox_grid.columns or defaults.trunk_grid.columns
        }
        create_other_inventory(inventory_type, plate, default_data)
        inventory = other_inventories[inventory_type][plate]
    end
    local items = {}
    for _, item in ipairs(inventory.items) do
        local item_data = exports.boii_items:find_item(item.item_id)
        if item_data then
            items[#items + 1] = {
                item_id = item.item_id,
                quantity = item.quantity,
                weight = item.weight,
                slot = item.slot,
                grid = item.grid,
                data = item.data,
                image = item_data.image,
                label = item_data.label,
                category = item_data.category,
                description = item_data.description
            }
        else
            print('Item data not found for item ID: ' .. item.item_id)
        end
    end
    local inventory_data = {
        type = inventory_type,
        id = (inventory_type == 'glovebox' and 'GLOVEBOX - ' or 'TRUNK - ') .. plate,
        plate = plate,
        carry_weight = inventory.carry_weight,
        current_weight = inventory.current_weight,
        max_slots = inventory.max_slots,
        grid_rows = inventory.grid_rows,
        grid_columns = inventory.grid_columns,
        items = items
    }
    cb(inventory_data, 'Vehicle inventory retrieved successfully.')
end)