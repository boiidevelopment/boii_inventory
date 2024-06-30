--- Inventory commands
--- @script server/scripts/commands.lua

--- @section Player inventory

--- Test create inventory
utils.commands.register('inv:create', { 'dev' }, 'Create a test inventory object.', {}, function(source, args, raw)
    exports.boii_inventory:init(source)
end)

--- Modify a players inventory
utils.commands.register('inv:modify', { 'dev' }, 'Adjust a players inventory.', {
    { name = 'id', help = 'Target id to adjust inventory for.' }, 
    { name = 'item_name', help = 'ID for the item to add/remove' }, 
    { name = 'action', help = 'add | remove' }, 
    { name = 'amount', help = 'The amount to add/remove.' }
}, function(source, args, raw)
    local target = tonumber(args[1])
    local item = tostring(args[2])
    local action = tostring(args[3])
    local amount = tonumber(args[4])
    if not target or not item or not action or not amount then
        print('Usage: /inv:modify <id> <item_name> <action> <amount>')
        return
    end
    local player = get_player(target)
    if player then
        player.modify_inventory({{ item_id = item, action = action, quantity = amount }}, 'Admin command: adjust_inventory.', true)
    end
end)

--- Modify a players inventory
utils.commands.register('inv:view_player', { 'dev' }, 'View a players inventory.', {
    { name = 'id', help = 'Target id to adjust inventory for.' }
}, function(source, args, raw)
    local target = tonumber(args[1])
    if not target then
        print('Usage: /inv:view_player <id>')
        return
    end
    local player_inventory = get_player_inventory(target)
    if player_inventory then
        TriggerEvent('boii_inventory:sv:view_player_inventory', source, player_inventory)
    end
end)