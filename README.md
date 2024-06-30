# BOII Development - Combined Slot & Grid Inventory

![INVENTORY_THUMB](https://github.com/boiidevelopment/boii_inventory/assets/90377400/5452c7d5-1b03-4f46-8b48-390ffa60739a)

## 📹 Preview

**[YouTube](https://www.youtube.com/watch?v=Xpif-1YezUQ)**

## 🌍 Overview

Introducing BOII Inventory!

This resource was created to be the main inventory within the BOII Framework, with the flexibility to support both role-play (RP) servers and survival servers. 
The inventory system offers a combined slot and grid-based inventory, allowing server administrators to switch between the two with a config toggle. 
The resource is designed to be virtually standalone through the use of boii_utils, and should be easy to integrate into any existing framework.

Please be aware this resource is currently a basic alpha release, a lot of work will be done, some bugs are to be expected.
Do not expect this to drag and drop into any other framework it simply will not, some setup will be required. 
This should be relatively simple to do however information on how to do this is currently limited, this will be updated in due course.

Appreciate any feedback that comes for this and will make sure to get it fully finished and out as soon as possible! 
For now its just another free inventory for people to mess around with <3

Enjoy!

## 🌐 Features

- **Slot Based Inventory:** A regular slot based inventory with customisable max slots on a player by player basis. 
- **Grid Based Inventory:** A grid based inventory with customisable grid sizes per player.
- **Other Inventory Support:** Supports other inventories, currently only covers gloveboxes and trunks however additional "others" can be added easily.
- **Stack Splitting:** Both inventories support splitting stacks of items.
- **Use & Drop Items:** Both inventories support using and dropping items through `boii_items`.

## 💹 Dependencies

- `oxmysql`
- `boii_utils`
- `boii_items`

## 📦 Installation

### Prerequisites

- Downloading `boii_utils`:

1. Download the utility library from one of our platforms; 

- https://github.com/boiidevelopment/boii_utils
- https://boiidevelopment.tebex.io/package/5972340

2. Edit `server/config.lua`:

- Set your UI choices under `config.ui`
- `config.ui.notify` for your notification system.
- `config.ui.progressbar` for your progress bar system.
- `config.ui.drawtext` for your drawtext resource.

Any other changes to the configs you wish to make can also be made.

### Script installation

1. Customisation:

- Customise `server/config.lua` to define your default stats for inventories and enable multicharacter if required.

2. Installation:

- Drag and drop `boii_inventory` into your server resources
- Add `ensure boii_inventory` into your `server.cfg` ensuring it is placed after `boii_utils`

3. Restart server:

- Once you have completed the above steps you are ready to restart your server and test out the inventory.

### Inventory initialization

1. Add the following export into your framework. 
- Typically you would want to add this into your player joined event if applicable or somewhere within a player object.

2. You will need to modify your frameworks player object functions to redirect into the inventory, no information is currently provided for how to do this. Please do not expect this to just work.

- Export
```lua
exports.boii_inventory:init(player.source)
```
- Example usage
```lua
RegisterNetEvent('boii:player_joined', function(player)
    exports.boii_inventory:init(player.source)
end)
```
- If this has been added correctly a inventory object will be created on players when they join the server.

## 📝 Notes

- This resource is built to be flexible and should integrate well with other frameworks with some adjustments, however you are expected to do this yourself right now.
- Always ensure you are using the latest version of `boii_utils` to avoid compatibility issues.
- Please remember this inventory is still in alpha stages, this is not a complete resource, some bugs are too be expected.
- Again, alpha release, its free, please do not harass me about it, it will be finished and fully release ready as soon as possible, patience is appreciated. 

## 🤝 Contributions

Contributions are welcome! If you'd like to contribute to the development of this resource, please fork the repository and submit a pull request or contact through discord.

## 📩 Support

https://discord.gg/boiidevelopment
