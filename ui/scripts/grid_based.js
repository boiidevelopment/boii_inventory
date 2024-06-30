class GridBased {
    constructor(data) {
        this.player_inventory = data.player_inventory;
        this.other_inventory = data.other_inventory || null;
        this.rows = data.player_inventory.grid_rows || 10;
        this.columns = data.player_inventory.grid_columns || 10;
        this.other_rows = this.other_inventory ? this.other_inventory.grid_rows : this.rows;
        this.other_columns = this.other_inventory ? this.other_inventory.grid_columns : this.columns;
        this.cell_size = 66;

        $(document).ready(() => {
            $(document).off('keyup').on('keyup', (e) => this.handle_exit(e));
            this.render_inventory(this.player_inventory, this.other_inventory);
        });
    }

    handle_exit(e) {
        if (e.key === 'Escape') {
            this.close();
        }
    }

    close() {
        this.save_inventory();
        $('#main_container').empty();
        $.post(`https://${GetParentResourceName()}/close_inventory`, JSON.stringify({}));
        inventory = null;
    }

    render_inventory(player_inventory, other_inventory) {
        this.player_inventory = player_inventory;
        this.other_inventory = other_inventory;
        this.other_rows = other_inventory ? other_inventory.grid_rows : this.rows;
        this.other_columns = other_inventory ? other_inventory.grid_columns : this.columns;
        $('#main_container').html(this.build_grid_inventory(player_inventory, other_inventory));
        this.make_all_items_draggable();
        this.setup_hover_events();
        this.setup_context_menu();
        if (other_inventory) {
            $('.other_grid').css({
                'grid-template-columns': `repeat(${this.other_columns}, 64px)`,
                'grid-template-rows': `repeat(${this.other_rows}, 64px)`
            });
        }
    }

    build_grid_inventory(player_inventory, other_inventory) {
        console.log('player_items: ' + JSON.stringify(player_inventory.items));
        const player_weight_percentage = (player_inventory.current_weight / player_inventory.carry_weight) * 100;
        const other_weight_percentage = other_inventory ? (other_inventory.current_weight / other_inventory.carry_weight) * 100 : 0;
        const player_grid = this.build_grid(player_inventory, 'player', this.rows, this.columns);
        const other_grid = other_inventory ? this.build_grid(other_inventory, 'other', this.other_rows, this.other_columns) : '';
        return `
            <div class="grid_inventory">
                <div class="grid_inventory_header">
                    <h3>${player_inventory.name} - #${player_inventory.server_id} </h3>
                    <div class="grid_header_buttons">
                        <button id="grid_toggle_info" class="grid_header_btn"><i class="fa-solid fa-circle-info"></i></button>
                        <button id="grid_toggle_settings" class="grid_header_btn"><i class="fa-solid fa-gear"></i></button>
                        <button id="grid_close" class="grid_header_btn"><i class="fa-solid fa-right-from-bracket"></i></button>
                    </div>
                </div>
                <div class="grid_weight_bar_container" id="inventory_weight">
                    <div class="grid_weight_bar" style="position: relative;">
                        <div class="grid_weight" style="width: ${player_weight_percentage}%;">
                            <div class="weight_tooltip">${(player_inventory.current_weight / 1000).toFixed(2)}/${(player_inventory.carry_weight / 1000).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div class="grid_inventory_container">
                    <div class="grid">
                        ${player_grid}
                    </div>
                </div>
                ${other_inventory ? `
                <div class="other_grid_inventory">
                    <div class="grid_inventory_header">
                        <h3>${other_inventory.id}</h3>
                    </div>
                    <div class="grid_weight_bar_container" id="other_inventory_weight">
                        <div class="grid_weight_bar" style="position: relative;">
                            <div class="grid_weight" style="width: ${other_weight_percentage}%;">
                                <div class="other_weight_tooltip">${(other_inventory.current_weight / 1000).toFixed(2)}/${(other_inventory.carry_weight / 1000).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="grid other_grid">
                        ${other_grid}
                    </div>
                </div>
                ` : ''}
                <div class="item_info_container" id="item_info"></div>
                <div class="context_menu" id="context_menu"></div>
                <div id="modal" class="modal">
                    <div class="modal_content">
                        <button class="modal_close_btn" id="close-modal"><i class="fa-solid fa-xmark"></i></button>
                        <div id="modal-body"></div>
                    </div>
                </div>
            </div>
        `;
    }

    build_grid(inventory, inventory_type, rows, columns) {
        let grid_cells = '';
        for (let i = 0; i < rows * columns; i++) {
            const cellClass = inventory_type === 'other' ? 'other_inv_cell' : 'grid_inv_cell';
            grid_cells += `<div class="${cellClass}" data-index="${i}" data-inventory="${inventory_type}"></div>`;
        }
        inventory.items.forEach((item) => {
            const unique_id = `${item.item_id}-${item.grid.x}-${item.grid.y}-${inventory_type}`;
            const quality_bar = item.data && (item.data.quality !== undefined || item.data.durability !== undefined) ? `<div class="item_quality"><div class="item_quality-bar" style="width: ${item.data.quality || item.data.durability}%;"></div></div>` : '';
            const ammo_display = item.data && item.data.ammo ? `<div class="item_ammo_count"><i class="fa-solid fa-crosshairs"></i> ${item.data.ammo}</div>` : '';
            const slot_display = item.slot && item.slot <= 6 ? `<div class="item-slot">${item.slot}</div>` : '';
            const item_class = inventory_type === 'other' ? 'other_inv_cell other_item' : 'grid_inv_cell item';
            grid_cells += `
                <div class="${item_class}" data-item-id="${item.item_id}" data-item-unique-id="${unique_id}" data-inventory="${inventory_type}" data-index="${(item.grid.x - 1) + (item.grid.y - 1) * columns}" style="width: ${item.grid.width * this.cell_size}px; height: ${item.grid.height * this.cell_size}px; left: ${(item.grid.x - 1) * this.cell_size}px; top: ${(item.grid.y - 1) * this.cell_size}px; background-image: url('assets/images/${item.image}');">
                    <div class="item_quantity">${item.quantity}x</div>
                    ${ammo_display}
                    ${quality_bar}
                    ${slot_display}
                </div>
            `;
        });
        return grid_cells;
    }

    make_all_items_draggable() {
        $('.item').each((index, item) => {
            this.make_draggable($(item), '.grid_inventory_container .grid');
        });
        $('.other_item').each((index, item) => {
            this.make_draggable($(item), '.other_grid_inventory .grid');
        });
    }

    make_draggable(item, container) {
        const self = this;
        item.draggable({
            grid: [this.cell_size, this.cell_size],
            containment: container,
            start: (event, ui) => {
                item.css('cursor', 'grabbing');
                this.highlight_cells(item, 'start');
                item.css('z-index', 1000); 
            },
            drag: (event, ui) => {
                this.highlight_cells(item, 'drag');
            },
            stop: (event, ui) => {
                item.css('cursor', 'grab');
                this.highlight_cells(item, 'stop');
                item.css('z-index', '');
            }
        });

        $(container).find(".grid_inv_cell, .other_inv_cell").droppable({
            accept: ".item, .other_item",
            classes: {
                "ui-droppable-hover": "highlight"
            },
            drop: function (event, ui) {
                const dropped_on = $(this);
                const dragged_item = ui.draggable;
                const original_index = parseInt(dragged_item.data("index"));
                const new_index = parseInt(dropped_on.data("index"));
                const from_inventory = dragged_item.data("inventory");
                const to_inventory = dropped_on.data("inventory");
                let moved_item;
                const columns = from_inventory === 'player' ? self.columns : self.other_columns;
                const new_columns = to_inventory === 'player' ? self.columns : self.other_columns;
                if (from_inventory === 'player') {
                    moved_item = self.player_inventory.items.find(item => original_index === (item.grid.x - 1) + (item.grid.y - 1) * columns);
                } else {
                    moved_item = self.other_inventory.items.find(item => original_index === (item.grid.x - 1) + (item.grid.y - 1) * columns);
                }
                if (!moved_item) {
                    dragged_item.draggable('option', 'revert', true);
                    return;
                }
                const new_x = (new_index % new_columns) + 1;
                const new_y = Math.floor(new_index / new_columns) + 1;
                if (!self.can_place_item(moved_item, new_x, new_y, new_columns, to_inventory === 'player' ? self.rows : self.other_rows, to_inventory)) {
                    dragged_item.draggable('option', 'revert', true);
                    return;
                }
                self.remove_item(moved_item, from_inventory);
                moved_item.grid.x = new_x;
                moved_item.grid.y = new_y;
                if (to_inventory === 'player') {
                    self.player_inventory.items.push(moved_item);
                } else {
                    self.other_inventory.items.push(moved_item);
                }
                self.render_inventory(self.player_inventory, self.other_inventory);
                self.track_inventory_state();
            }
        });
    }

    transfer_item(item) {
        const unique_id = item.data('item-unique-id');
        const from_inventory = item.data('inventory');
        const to_inventory = from_inventory === 'player' ? 'other' : 'player';
        let moved_item;
        if (from_inventory === 'player') {
            moved_item = this.player_inventory.items.find(i => `${i.item_id}-${i.grid.x}-${i.grid.y}-player` === unique_id);
        } else {
            moved_item = this.other_inventory.items.find(i => `${i.item_id}-${i.grid.x}-${i.grid.y}-other` === unique_id);
        }
        if (!moved_item) {
            return;
        }
        const moved_item_weight = moved_item.weight * moved_item.quantity;
        if (to_inventory === 'player' && (this.player_inventory.current_weight + moved_item_weight > this.player_inventory.carry_weight)) {
            return;
        } else if (to_inventory === 'other' && (this.other_inventory.current_weight + moved_item_weight > this.other_inventory.carry_weight)) {
            return;
        }
        let found_slot = false;
        const columns = to_inventory === 'player' ? this.columns : this.other_columns;
        const rows = to_inventory === 'player' ? this.rows : this.other_rows;
        outer_loop: for (let y = 1; y <= rows - moved_item.grid.height + 1; y++) {
            for (let x = 1; x <= columns - moved_item.grid.width + 1; x++) {
                if (this.can_place_item(moved_item, x, y, columns, rows, to_inventory)) {
                    moved_item.grid.x = x;
                    moved_item.grid.y = y;
                    found_slot = true;
                    break outer_loop;
                }
            }
        }
        if (!found_slot) {
            return;
        }
        this.update_inventory_weights(from_inventory, moved_item_weight);
        this.remove_item(moved_item, from_inventory);
        if (to_inventory === 'player') {
            this.player_inventory.items.push(moved_item);
        } else {
            this.other_inventory.items.push(moved_item);
        }
        this.render_inventory(this.player_inventory, this.other_inventory);
    }

    update_inventory_weights(from_inventory, weight) {
        console.log('inv: ' + from_inventory + ' weight: ' + weight)
        if (from_inventory === 'player') {
            this.player_inventory.current_weight -= weight;
            this.other_inventory.current_weight += weight;
        } else {
            this.player_inventory.current_weight += weight;
            this.other_inventory.current_weight -= weight;
        }
        this.player_inventory.current_weight = Math.max(0, this.player_inventory.current_weight);
        this.other_inventory.current_weight = Math.max(0, this.other_inventory.current_weight);
    }
    
    can_place_item(item, start_x, start_y, columns, rows, inventory_type) {
        const inventory = inventory_type === 'player' ? this.player_inventory.items : this.other_inventory.items;
        for (let i = 0; i < item.grid.height; i++) {
            for (let j = 0; j < item.grid.width; j++) {
                const cell_x = start_x - 1 + j;
                const cell_y = start_y - 1 + i;
                if (cell_x >= columns || cell_y >= rows || cell_x < 0 || cell_y < 0) {
                    return false;
                }
                if (inventory.some(other_item => {
                    for (let k = 0; k < other_item.grid.height; k++) {
                        for (let l = 0; l < other_item.grid.width; l++) {
                            if (cell_x === other_item.grid.x - 1 + l && cell_y === other_item.grid.y - 1 + k) {
                                return true;
                            }
                        }
                    }
                    return false;
                })) {
                    return false;
                }
            }
        }
        return true;
    }
    
    get_item_at_position(x, y, inventory_type) {
        const inventory = inventory_type === 'player' ? this.player_inventory.items : this.other_inventory.items;
        return inventory.find(item => x >= item.grid.x && x < item.grid.x + item.grid.width && y >= item.grid.y && y < item.grid.y + item.grid.height);
    }

    remove_item(item, inventory_type) {
        if (inventory_type === 'player') {
            this.player_inventory.items = this.player_inventory.items.filter(i => i !== item);
        } else {
            this.other_inventory.items = this.other_inventory.items.filter(i => i !== item);
        }
    }

    get_max_stack(item) {
        return item.max_stack || 100;
    }

    highlight_cells(item, action) {
        const unique_id = item.attr('data-item-unique-id');
        const inventory_type = item.data('inventory');
        let item_data;
        if (inventory_type === 'player') {
            item_data = this.player_inventory.items.find(i => `${i.item_id}-${i.grid.x}-${i.grid.y}-player` === unique_id);
        } else if (inventory_type === 'other') {
            item_data = this.other_inventory.items.find(i => `${i.item_id}-${i.grid.x}-${i.grid.y}-other` === unique_id);
        }
        if (!item_data) { return };
        const columns = inventory_type === 'player' ? this.columns : this.other_columns;
        const rows = inventory_type === 'player' ? this.rows : this.other_rows;
        if (action === 'stop') {
            const new_x = Math.round(item.position().left / this.cell_size) + 1;
            const new_y = Math.round(item.position().top / this.cell_size) + 1;
            if (this.can_place_item(item_data, new_x, new_y, columns, rows, inventory_type)) {
                item_data.grid.x = new_x;
                item_data.grid.y = new_y;
                item.attr('data-item-unique-id', `${item_data.id}-${new_x}-${new_y}-${inventory_type}`);
            } else {
                item.css({
                    left: (item_data.grid.x - 1) * this.cell_size + 'px',
                    top: (item_data.grid.y - 1) * this.cell_size + 'px'
                });
            }
            if (inventory_type === 'player') {
                $('.grid_inv_cell').removeClass('highlight-green highlight-red');
            } else if (inventory_type === 'other') {
                $('.other_inv_cell').removeClass('highlight-green highlight-red');
            }
            $('.item, .other_item').removeClass('highlight').css('border', '');
        } else {
            const new_x = Math.round(item.position().left / this.cell_size) + 1;
            const new_y = Math.round(item.position().top / this.cell_size) + 1;
            if (this.can_place_item(item_data, new_x, new_y, columns, rows, inventory_type)) {
                for (let i = 0; i < item_data.grid.height; i++) {
                    for (let j = 0; j < item_data.grid.width; j++) {
                        const cell_x = new_x - 1 + j;
                        const cell_y = new_y - 1 + i;
                        const cell_index = cell_x + cell_y * columns;
                        if (inventory_type === 'player') {
                            $(`.grid_inv_cell[data-index=${cell_index}]`).addClass('highlight-green');
                        } else {
                            $(`.other_inv_cell[data-index=${cell_index}]`).addClass('highlight-green');
                        }
                    }
                }
                item.addClass('highlight').css('border', '2px solid green');
            } else {
                for (let i = 0; i < item_data.grid.height; i++) {
                    for (let j = 0; j < item_data.grid.width; j++) {
                        const cell_x = new_x - 1 + j;
                        const cell_y = new_y - 1 + i;
                        const cell_index = cell_x + cell_y * columns;
                        if (inventory_type === 'player') {
                            $(`.grid_inv_cell[data-index=${cell_index}]`).addClass('highlight-red');
                        } else {
                            $(`.other_inv_cell[data-index=${cell_index}]`).addClass('highlight-red');
                        }
                    }
                }
                item.addClass('highlight').css('border', '2px solid red');
            }
        }
    }

    render_items() {
        const grid = $('.grid');
        for (let i = 0; i < this.rows * this.columns; i++) {
            const grid_cell = $('<div class="grid_inv_cell" data-index="' + i + '"></div>');
            grid.append(grid_cell);
        }
        this.player_inventory.items.forEach((item) => {
            const unique_id = `${item.item_id}-${item.grid.x}-${item.grid.y}-player`;
            const quality_bar = item.data && (item.data.quality !== undefined || item.data.durability !== undefined) ? `<div class="item_quality"><div class="item_quality-bar" style="width: ${item.data.quality || item.data.durability}%;"></div></div>` : '';
            const ammo_display = item.data && item.data.ammo ? `<div class="item_ammo_count"><i class="fa-solid fa-crosshairs"></i> ${item.data.ammo}</div>` : '';
            const slot_display = item.slot && item.slot <= 6 ? `<div class="item-slot">${item.slot}</div>` : '';
            const item_element = $('<div class="grid_inv_cell item" data-item-id="' + item.item_id + '" data-item-unique-id="' + unique_id + '" data-inventory="player"></div>')
                .css({ width: item.grid.width * this.cell_size + 'px', height: item.grid.height * this.cell_size + 'px', left: (item.grid.x - 1) * this.cell_size + 'px', top: (item.grid.y - 1) * this.cell_size + 'px', backgroundImage: 'url(assets/images/' + item.image + ')' })
                .append('<div class="item_quantity">' + item.quantity + 'x</div>')
                .append(ammo_display)
                .append(quality_bar)
                .append(slot_display);
            grid.append(item_element);
            this.make_draggable(item_element, '.grid_inventory_container .grid');
        });
        if (this.other_inventory) {
            const other_grid = $('.other_grid');
            other_grid.empty();
            for (let i = 0; i < this.other_rows * this.other_columns; i++) {
                const grid_cell = $('<div class="grid_inv_cell other_inv_cell" data-index="' + i + '"></div>');
                other_grid.append(grid_cell);
            }
            this.other_inventory.items.forEach((item) => {
                const unique_id = `${item.item_id}-${item.grid.x}-${item.grid.y}-other`;
                const quality_bar = item.data && (item.data.quality !== undefined || item.data.durability !== undefined) ? `<div class="item_quality"><div class="item_quality-bar" style="width: ${item.data.quality || item.data.durability}%;"></div></div>` : '';
                const ammo_display = item.data && item.data.ammo ? `<div class="item_ammo_count"><i class="fa-solid fa-crosshairs"></i> ${item.data.ammo}</div>` : '';
                const slot_display = item.slot && item.slot <= 6 ? `<div class="item-slot">${item.slot}</div>` : '';
                const item_element = $('<div class="grid_inv_cell other_item" data-item-id="' + item.item_id + '" data-item-unique-id="' + unique_id + '" data-inventory="other"></div>')
                    .css({ width: item.grid.width * this.cell_size + 'px', height: item.grid.height * this.cell_size + 'px', left: (item.grid.x - 1) * this.cell_size + 'px', top: (item.grid.y - 1) * this.cell_size + 'px',  backgroundImage: 'url(assets/images/' + item.image + ')' })
                    .append('<div class="item_quantity">' + item.quantity + 'x</div>')
                    .append(ammo_display)
                    .append(quality_bar)
                    .append(slot_display);
                other_grid.append(item_element);
                this.make_draggable(item_element, '.other_grid_inventory .grid');
            });
        }
    }

    setup_hover_events() {
        const self = this;

        $('#inventory_weight').off('mouseenter mouseleave').hover(
            function () {
                const content = `${(self.player_inventory.current_weight / 1000).toFixed(2)}/${(self.player_inventory.carry_weight / 1000).toFixed(2)}kg`;
                $('.weight_tooltip').text(content).fadeIn(150);
            },
            function () {
                $('.weight_tooltip').fadeOut(150);
            }
        );

        $('#other_inventory_weight').off('mouseenter mouseleave').hover(
            function () {
                const content = `${(self.other_inventory.current_weight / 1000).toFixed(2)}/${(self.other_inventory.carry_weight / 1000).toFixed(2)}kg`;
                $('.other_weight_tooltip').text(content).fadeIn(150);
            },
            function () {
                $('.other_weight_tooltip').fadeOut(150);
            }
        );

        $('.item, .other_item').off('mouseenter mouseleave').hover(
            (event) => {
                const item_id = $(event.currentTarget).data('item-id');
                const item_data = this.player_inventory.items.find(i => i.item_id === item_id) || this.other_inventory.items.find(i => i.item_id === item_id);
                this.show_item_info(item_data);
            },
            () => {
                this.hide_item_info();
            }
        );
    }

    setup_context_menu() {
        const self = this;
    
        $(document).on('click keyup', (e) => {
            if (e.type === 'click' || (e.type === 'keyup' && e.key === 'Escape')) {
                $('#context_menu').hide();
            }
        });
    
        $(document).on('contextmenu', '.item, .other_item', function (event) {
            $('#modal').hide();
            event.preventDefault();
            const itemElement = $(this);
            const inventory_type = itemElement.data('inventory');
            const item_index = parseInt(itemElement.data('index'));
            const columns = inventory_type === 'player' ? self.columns : self.other_columns;
            const rows = inventory_type === 'player' ? self.rows : self.other_rows;
            const x = (item_index % columns) + 1;
            const y = Math.floor(item_index / columns) + 1;
            const inventory = inventory_type === 'player' ? self.player_inventory.items : self.other_inventory.items;
    
            const item_data = self.get_item_at_grid_position(x, y, inventory);
            if (!item_data) {
                console.error('Item data not found.');
                return;
            }
    
            const menu = $('#context_menu');
            let modify_item = '';
            let reload_item = '';
            if (item_data.category === 'weapons') {
                reload_item = `<li id="reload_item"><i class="fa-solid fa-redo"></i> Reload</li>`;
                modify_item = `<li id="modify_item"><i class="fa-solid fa-gear"></i> Modify</li>`;
            }
            let split_item = '';
            if (item_data.quantity > 1) {
                split_item = `<li id="split_item"><i class="fa-solid fa-arrows-alt-h"></i> Split Stack</li>`;
            }
            let transfer_item = self.other_inventory ? `<li id="transfer_item"><i class="fa-solid fa-exchange-alt"></i> Transfer to ${inventory_type === 'player' ? 'Other' : 'Player'}</li>` : '';
            let bind_slot_item = `<li id="bind_slot_item"><i class="fa-solid fa-link"></i> Bind Slot</li>`;
            menu.html(`
                <ul>
                    <li id="use_item"><i class="fa-solid fa-hand"></i> Use</li>
                    <li id="drop_item"><i class="fa-solid fa-trash-can"></i> Drop</li>
                    ${split_item}
                    ${reload_item}
                    ${modify_item}
                    ${transfer_item}
                    ${bind_slot_item}
                </ul>
            `);
            menu.css({ top: event.pageY, left: event.pageX }).show();
    
            $('#use_item').off('click').on('click', () => {
                self.close();
                $.post(`https://${GetParentResourceName()}/use_item`, JSON.stringify({ item_id: item_data.item_id }));
                menu.hide();
            });
    
            $('#drop_item').off('click').on('click', () => {
                self.close();
                $.post(`https://${GetParentResourceName()}/drop_item`, JSON.stringify({ item_id: item_data.item_id, quantity: item_data.quantity }));
                menu.hide();
            });
    
            $('#modify_item').off('click').on('click', () => {
                console.log('Modify', item_data);
                menu.hide();
            });
    
            $('#reload_item').off('click').on('click', () => {
                console.log('Reload', item_data);
                menu.hide();
            });
    
            $('#split_item').off('click').on('click', () => {
                self.show_modal('split', item_data);
                menu.hide();
            });
    
            $('#transfer_item').off('click').on('click', () => {
                self.transfer_item(itemElement);
                menu.hide();
            });
    
            $('#bind_slot_item').off('click').on('click', () => {
                self.show_modal('bind_slot', item_data);
                menu.hide();
            });
        });
    }
    
    bind_slot(item, new_slot) {
        console.log('Binding item to new slot:', item, new_slot);
        item.slot = new_slot;
        this.render_inventory(this.player_inventory, this.other_inventory);
    }

    show_item_info(item) {
        let quality_dura = '';
        if (item.data) {
            if (item.data.quality !== undefined) {
                quality_dura = `<div>Quality: ${item.data.quality}%</div>`;
            } else if (item.data.durability !== undefined) {
                quality_dura = `<div>Durability: ${item.data.durability}%</div>`;
            }
        }
        const item_info = `
            <div class="item_info">
                <h3>${item.label}</h3>
                <p>${item.description}</p>
                <div class="item_info_grid">
                    <div>Quantity: ${item.quantity}</div>
                    ${quality_dura}
                </div>
            </div>
        `;
        $('#item_info').html(item_info).show();
    }

    hide_item_info() {
        $('#item_info').hide().empty();
    }

    track_inventory_state() {
        this.updated_inventory_state = {
            player_inventory: {
                carry_weight: this.player_inventory.carry_weight,
                current_weight: this.player_inventory.current_weight,
                max_slots: this.player_inventory.max_slots,
                items: this.player_inventory.items.map(item => ({
                    item_id: item.item_id,
                    slot: item.slot,
                    grid: item.grid,
                    quantity: item.quantity,
                    weight: item.weight,
                    data: item.data
                })),
            },
            other_inventory: this.other_inventory ? {
                id: this.other_inventory.id,
                type: this.other_inventory.type,
                plate: this.other_inventory.plate,
                carry_weight: this.other_inventory.carry_weight,
                current_weight: this.other_inventory.current_weight,
                max_slots: this.other_inventory.max_slots,
                grid_rows: this.other_inventory.grid_rows,
                grid_columns: this.other_inventory.grid_columns,
                items: this.other_inventory.items.map(item => ({
                    item_id: item.item_id,
                    slot: item.slot,
                    grid: item.grid,
                    quantity: item.quantity,
                    weight: item.weight,
                    data: item.data
                }))
            } : null
        };
    }
    
    save_inventory() {
        this.track_inventory_state();
        $.post(`https://${GetParentResourceName()}/save_inventory`, JSON.stringify(this.updated_inventory_state), (response) => {
            console.log('Inventory saved on the server:', response);
        });
    }
    
    save_inventory() {
        this.track_inventory_state();
        $.post(`https://${GetParentResourceName()}/save_inventory`, JSON.stringify(this.updated_inventory_state), (response) => {
            console.log('Inventory saved on the server:', response);
        });
    }
    
    show_modal(type, item) {
        let modal_body = '';
        if (type === 'split') {
            modal_body = `
                <p>Enter amount to split:</p>
                <div style="display: flex; justify-content: center; align-items: center;">
                    <input type="number" id="split_input" min="1" max="${item.quantity - 1}" />
                    <button class="header_btn modal_confirm" id="split_confirm"><i class="fa-solid fa-check"></i></button>
                </div>
            `;
        } else if (type === 'bind_slot') {
            modal_body = `
                <p>Enter slot number: (1-6)</p>
                <div style="display: flex; justify-content: center; align-items: center;">
                    <input type="number" id="bind-slot-input" min="1" />
                    <button class="header_btn modal_confirm" id="bind-slot-confirm"><i class="fa-solid fa-check"></i></button>
                </div>
            `;
        }
        $('#modal-body').html(modal_body);
        $('#modal').show();
        $('#close-modal').off('click').on('click', () => {
            $('#modal').hide();
        });
        if (type === 'split') {
            $('#split_confirm').off('click').on('click', () => {
                const split_amount = parseInt($('#split_input').val());
                if (split_amount > 0 && split_amount < item.quantity) {
                    this.split_item(item, split_amount);
                    $('#modal').hide();
                } else {
                    console.log('Invalid split amount.');
                }
            });
        } else if (type === 'bind_slot') {
            $('#bind-slot-confirm').off('click').on('click', () => {
                const new_slot = parseInt($('#bind-slot-input').val());
                if (new_slot > 0) {
                    this.bind_slot(item, new_slot);
                    $('#modal').hide();
                } else {
                    console.log('Invalid slot number.');
                }
            });
        }
    }    
    
    split_item(item, split_amount) {
        const inventory_type = this.player_inventory.items.includes(item) ? 'player' : 'other';
        const available_grid_position = this.find_next_available_grid_position(item.grid.width, item.grid.height, inventory_type);
        const available_slot = this.find_next_available_slot(inventory_type);
        
        if (available_grid_position !== null && available_slot !== null) {
            const new_item = {
                ...item,
                id: `${item.item_id}-${Date.now()}`,
                quantity: split_amount,
                grid: available_grid_position,
                slot: available_slot
            };
            item.quantity -= split_amount;
            
            if (inventory_type === 'player') {
                this.player_inventory.items.push(new_item);
            } else {
                this.other_inventory.items.push(new_item);
            }
    
            this.render_inventory(this.player_inventory, this.other_inventory);
        } else {
            alert('No available slot or grid position to place the split item.');
        }
    }
    
    
    find_next_available_grid_position(item_width, item_height, inventory_type) {
        const grid_width = inventory_type === 'player' ? this.columns : this.other_columns;
        const grid_height = inventory_type === 'player' ? this.rows : this.other_rows;
        const inventory = inventory_type === 'player' ? this.player_inventory.items : this.other_inventory.items;
        for (let y = 1; y <= grid_height - item_height + 1; y++) {
            for (let x = 1; x <= grid_width - item_width + 1; x++) {
                if (this.can_place_item_at_position(x, y, item_width, item_height, inventory, grid_width, grid_height)) {
                    return { x: x, y: y, width: item_width, height: item_height };
                }
            }
        }
        return null;
    }
    
    can_place_item_at_position(start_x, start_y, item_width, item_height, inventory, grid_width, grid_height) {
        for (let y = start_y; y < start_y + item_height; y++) {
            for (let x = start_x; x < start_x + item_width; x++) {
                if (x > grid_width || y > grid_height || this.get_item_at_grid_position(x, y, inventory)) {
                    return false;
                }
            }
        }
        return true;
    }
    
    get_item_at_grid_position(x, y, inventory) {
        if (!inventory) {
            console.error('Inventory is undefined.');
            return null;
        }
    
        return inventory.find(item => {
            const item_x_start = item.grid.x;
            const item_y_start = item.grid.y;
            const item_x_end = item_x_start + item.grid.width - 1;
            const item_y_end = item_y_start + item.grid.height - 1;
            return x >= item_x_start && x <= item_x_end && y >= item_y_start && y <= item_y_end;
        });
    }
    
    find_next_available_slot(inventory_type) {
        const inventory = inventory_type === 'player' ? this.player_inventory.items : this.other_inventory.items;
        const max_slots = inventory_type === 'player' ? this.player_inventory.max_slots : this.other_inventory.max_slots;
        
        for (let i = 0; i < max_slots; i++) {
            if (!inventory.some(item => item.slot === i)) {
                return i;
            }
        }
        return null;
    }
    
}

//const test_grid_inv = new GridBased(inv_test_data);