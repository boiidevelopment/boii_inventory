--[[
     ____   ____ _____ _____   _   _____  ________      ________ _      ____  _____  __  __ ______ _   _ _______ 
    |  _ \ / __ \_   _|_   _| | | |  __ \|  ____\ \    / /  ____| |    / __ \|  __ \|  \/  |  ____| \ | |__   __|
    | |_) | |  | || |   | |   | | | |  | | |__   \ \  / /| |__  | |   | |  | | |__) | \  / | |__  |  \| |  | |   
    |  _ <| |  | || |   | |   | | | |  | |  __|   \ \/ / |  __| | |   | |  | |  ___/| |\/| |  __| | . ` |  | |   
    | |_) | |__| || |_ _| |_  | | | |__| | |____   \  /  | |____| |___| |__| | |    | |  | | |____| |\  |  | |   
    |____/ \____/_____|_____| | | |_____/|______|   \/   |______|______\____/|_|    |_|  |_|______|_| \_|  |_|   
                              | |                                                                                
                              |_|               INVENTORY
]]

fx_version 'cerulean'
games { 'gta5', 'rdr3' }

name 'boii_inventory'
version '0.0.1'
description 'BOII | Development - Inventory'
author 'boiidevelopment'
repository 'https://github.com/boiidevelopment/boii_inventory'
lua54 'yes'

ui_page 'ui/index.html'

files {
    'ui/**/**/**/**',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/config.lua',
    'server/init.lua',
    'server/scripts/player_inventory.lua',
    'server/scripts/other_inventories.lua',
    'server/scripts/commands.lua',
    'server/main.lua'
}

client_scripts {
    'client/init.lua',
    'client/main.lua',
    'client/scripts/commands.lua',
}

escrow_ignore {
    'server/**',
    'client/**',
    'shared/**'
}
