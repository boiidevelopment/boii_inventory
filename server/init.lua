--- @section Dependencies

--- Import utility library.
utils = exports.boii_utils:get_utils()

--- @section Tables

player_inventories = player_inventories or {}

other_inventories = {
    glovebox = {},
    trunk = {},
    stash = {}
}

--- @section Global functions

--- Returns player inventory
function get_player(_src)
    if not _src then print('no source provided') return end
    return player_inventories[_src]
end

--- Sends a notification using utils.ui bridge.
function send_notification(_src, header, message, type, duration)
    utils.ui.notify(_src, {
        header = header,
        message = message,
        type = type,
        duration = duration
    })
end

--- Finds the next available slot for new items.
function find_next_available_slot(items, max_slots)
    local occupied_slots = {}
    for _, item in pairs(items) do
        if item.slot then
            occupied_slots[item.slot] = true
        end
    end
    for i = 1, max_slots do
        if not occupied_slots[i] then
            return i
        end
    end
    return nil
end

--- Finds next available grid position for new items.
function find_next_available_grid_position(items, grid_width, grid_height, item_width, item_height)
    local grid = {}
    for i = 1, grid_height do
        grid[i] = {}
        for j = 1, grid_width do
            grid[i][j] = false
        end
    end
    for _, item in pairs(items) do
        if item.grid and item.grid.y and item.grid.x and item.grid.width and item.grid.height then
            for y = item.grid.y, item.grid.y + item.grid.height - 1 do
                for x = item.grid.x, item.grid.x + item.grid.width - 1 do
                    grid[y][x] = true
                end
            end
        end
    end
    for y = 1, grid_height - item_height + 1 do
        for x = 1, grid_width - item_width + 1 do
            local can_place = true
            for dy = 0, item_height - 1 do
                for dx = 0, item_width - 1 do
                    if grid[y + dy][x + dx] then
                        can_place = false
                        break
                    end
                end
                if not can_place then
                    break
                end
            end
            if can_place then
                return {x = x, y = y, width = item_width, height = item_height}
            end
        end
    end
    return nil
end

--- Creates main inventory tables.
--- Player vehicles is place holder boii_core currently has no support for owned vehicles.
local function create_tables()
    local queries = {
        [[
            CREATE TABLE IF NOT EXISTS `player_inventories` (
                `id` INT(11) NOT NULL AUTO_INCREMENT,
                `player` VARCHAR(255) NOT NULL,
                `max_slots` INT(11) NOT NULL DEFAULT 36,
                `grid_rows` INT(2) NOT NULL DEFAULT 10,
                `grid_columns` INT(2) NOT NULL DEFAULT 10,
                `carry_weight` INT(11) NOT NULL DEFAULT 80000,
                `current_weight` INT(11) NOT NULL DEFAULT 0,
                `items` JSON NOT NULL DEFAULT '{}',
                PRIMARY KEY (`id`),
                UNIQUE KEY `unique_player` (`player`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ]],
        [[
            CREATE TABLE IF NOT EXISTS `player_vehicles` (
                `id` INT(11) NOT NULL AUTO_INCREMENT,
                `player` VARCHAR(255) NOT NULL,
                `plate` VARCHAR(255) NOT NULL,
                `weights` JSON NOT NULL DEFAULT '{}',
                `slots` JSON NOT NULL DEFAULT '{}',
                `grid` JSON NOT NULL DEFAULT '{}',
                `items` JSON NOT NULL DEFAULT '{}',
                PRIMARY KEY (`id`),
                UNIQUE KEY `unique_plate` (`plate`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ]]
    }

    for _, query in ipairs(queries) do
        MySQL.update(query, {}, function(affectedRows)
            if affectedRows then
                print("Table creation/update successful.")
            else
                print("Error in table creation/update.")
            end
        end)
    end
end

--- Create tables on resource start.
AddEventHandler('onResourceStart', function(res)
    if GetCurrentResourceName() == res then
        create_tables()
    end
end)
