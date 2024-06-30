/*
     ____   ____ _____ _____   _   _____  ________      ________ _      ____  _____  __  __ ______ _   _ _______ 
    |  _ \ / __ \_   _|_   _| | | |  __ \|  ____\ \    / /  ____| |    / __ \|  __ \|  \/  |  ____| \ | |__   __|
    | |_) | |  | || |   | |   | | | |  | | |__   \ \  / /| |__  | |   | |  | | |__) | \  / | |__  |  \| |  | |   
    |  _ <| |  | || |   | |   | | | |  | |  __|   \ \/ / |  __| | |   | |  | |  ___/| |\/| |  __| | . ` |  | |   
    | |_) | |__| || |_ _| |_  | | | |__| | |____   \  /  | |____| |___| |__| | |    | |  | | |____| |\  |  | |   
    |____/ \____/_____|_____| | | |_____/|______|   \/   |______|______\____/|_|    |_|  |_|______|_| \_|  |_|   
                              | |                                                                                
                              |_|                INVENTORY
*/

let inventory = null;

window.addEventListener('message', function (event) {
    let data = event.data;
    if (data.action === 'open_inventory') {
        if (!inventory) {
            if (data.data.type === 'grid') {
                inventory = new GridBased(data.data);
            } else {
                inventory = new SlotBased(data.data);
            }
        }
    } else if (data.action === 'close_inventory') {
        if (inventory) {
            inventory.close();
            inventory = null;
        }
    } else if (data.action === 'display_item_box') {
        display_item_box(data.data);
    }
});


function display_item_box(data) {
    const action_map = {
        add: 'Received',
        remove: 'Removed',
        drop: 'Dropped',
        use: 'Used',
        update: 'Updated'
    };
    const unique_id = `${data.item.item_id}_${data.action}_${Date.now()}`;
    const item_box_id = `item_box_${unique_id}`;
    const item_box = `
        <div class="item_box" id="${item_box_id}">
            <div class="item_box_quantity">${data.item.quantity}x</div>
            <img src="assets/images/${data.item.image}" alt="${data.item.label}" />
            <div class="item_box_info">
                <div class="item_box_action">${action_map[data.action]}</div>
            </div>
        </div>
    `;
    
    if ($('#item_box_container').length === 0) {
        $('body').append('<div id="item_box_container" style="position: fixed; top: 10px; right: 10px; z-index: 1000;"></div>');
    }
    
    const item_box_container = $('#item_box_container');
    item_box_container.append(item_box);
    
    setTimeout(() => {
        $(`#${item_box_id}`).fadeOut(300, function() {
            $(this).remove();
        });
    }, 3000);
}

// Example data to test the inventory
const inv_test_data = {
    player_details: {
        name: 'John Doe',
        server_id: 1,
        unique_id: 'boii_123456',
        job: 'LSPD',
        grade: 'Police Officer',
        phone_no: 123456789
    },
    player_inventory: {
        carry_weight: 80000,
        current_weight: 0,
        max_slots: 36,
        items: [
            {
                item_id: 'water',
                category: 'consumables',
                image: 'water.png',
                label: 'Water',
                description: 'A refreshing bottle of water.',
                quantity: 10,
                weight: 330,
                max_stack: 100,
                grid: { x: 1, y: 1, height: 1, width: 1 },
                slot: 1,
                data: {
                    quality: 100
                }
            }
        ]
    },
    other_inventory: {
        id: 'Glovebox',
        max_slots: 6,
        carry_weight: 10000,
        current_weight: 0,
        grid_rows: 6,
        grid_columns: 6,
        items: [
            {
                item_id: 'burger',
                category: 'consumables',
                image: 'burger.png',
                label: 'Burger',
                description: 'A mouth watering burger.',
                quantity: 10,
                weight: 400,
                max_stack: 100,
                grid: { x: 2, y: 1, height: 1, width: 1 },
                slot: 1,
                data: {
                    quality: 100
                }
            }
        ]
    }
};

