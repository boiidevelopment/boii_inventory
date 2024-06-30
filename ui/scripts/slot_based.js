class SlotBased {
    constructor(data) {
        this.player_inventory = data.player_inventory;
        this.other_inventory = data.other_inventory || null;
        this.max_slots = data.player_inventory.max_slots || 36;
        this.slots = Array(this.max_slots).fill(null);

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

    populate_slots() {
        this.player_inventory.items.forEach(item => {
            if (item.slot >= 1 && item.slot <= this.max_slots) {
                this.slots[item.slot - 1] = item;
            }
        });
    }

    calculate_initial_weight(inventory) {
        return inventory.items.reduce((total, item) => total + (item.weight * item.quantity), 0);
    }

    render_inventory(player_inventory, other_inventory) {
        this.player_inventory = player_inventory;
        this.other_inventory = other_inventory;
        this.populate_slots();
        this.player_inventory.current_weight = this.calculate_initial_weight(this.player_inventory);
        if (this.other_inventory) {
            this.other_inventory.current_weight = this.calculate_initial_weight(this.other_inventory);
        }

        let content = this.build_slot_inventory(player_inventory);
        if (other_inventory) {
            content += this.build_other_inventory(other_inventory);
        }
        $('#main_container').html(content);
        this.setup_draggable();
        this.setup_hover_events();
        this.setup_context_menu_events();
    }

    build_slot_inventory(player_inventory) {
        let slots = '';
        for (let i = 0; i < this.max_slots; i++) {
            const item = player_inventory.items.find(itm => itm.slot === i + 1);
            const slot_number = i < 6 ? `<div class="item-slot">${i + 1}</div>` : '';
            if (item) {
                const quality_bar = item.data && (item.data.quality !== undefined || item.data.durability !== undefined) ? `<div class="slot_item_quality"><div class="slot_item_quality_bar" style="width: ${item.data.quality || item.data.durability}%;"></div></div>` : '';
                const ammo_display = item.data && item.data.ammo ? `<div class="item_ammo_count"><i class="fa-solid fa-crosshairs"></i> ${item.data.ammo}</div>` : '';
                slots += `
                    <div class="slot item_slot" data-item-id="${item.item_id}" data-index="${i}" data-inventory="player">
                        ${slot_number}
                        <img src="assets/images/${item.image}" alt="${item.label}" />
                        <div class="item_quantity">${item.quantity}x</div>
                        ${quality_bar}
                        ${ammo_display}
                    </div>
                `;
            } else {
                slots += `<div class="slot empty_slot" data-id="" data-index="${i}" data-inventory="player">${slot_number}</div>`;
            }
        }
        const weight_percentage = (player_inventory.current_weight / player_inventory.carry_weight) * 100;
        const content = `
            <div class="slot_inventory">
                <div class="slot_inventory_header">
                    <h3>${player_inventory.name} - #${player_inventory.server_id}</h3>
                    <div class="slot_header_buttons">
                        <button id="slot_toggle_info" class="slot_header_btn"><i class="fa-solid fa-circle-info"></i></button>
                        <button id="slot_toggle_settings" class="slot_header_btn"><i class="fa-solid fa-gear"></i></button>
                        <button id="slot_close" class="slot_header_btn"><i class="fa-solid fa-right-from-bracket"></i></button>
                    </div>
                </div>
                <div class="slot_weight_bar_container" id="inventory_weight">
                    <div class="slot_weight_bar" style="position: relative;">
                        <div class="slot_weight" style="width: ${weight_percentage}%; transition: width 0.5s;">
                            <div class="weight_tooltip">${(player_inventory.current_weight / 1000).toFixed(2)}/${(player_inventory.carry_weight / 1000).toFixed(2)}kg</div>
                        </div>
                    </div>
                </div>
                <div class="slot_inventory_container">
                    <div class="slots">
                        ${slots}
                    </div>
                </div>
                <div class="item_info_container" id="player_item_info"></div>
                <div class="context_menu" id="context_menu"></div>
                <div id="modal" class="modal">
                    <div class="modal_content">
                        <button class="modal_close_btn" id="close-modal"><i class="fa-solid fa-xmark"></i></button>
                        <div id="modal-body"></div>
                    </div>
                </div>
            </div>
        `;
        return content;
    }

    build_other_inventory(other_inventory) {
        let slots = '';
        const max_slots = other_inventory.max_slots || 36;
        for (let i = 0; i < max_slots; i++) {
            const item = other_inventory.items.find(itm => itm.slot === i + 1);
            if (item) {
                const quality_bar = item.data && (item.data.quality !== undefined || item.data.durability !== undefined) ? `<div class="slot_item_quality"><div class="slot_item_quality_bar" style="width: ${item.data.quality || item.data.durability}%;"></div></div>` : '';
                const ammo_display = item.data && item.data.ammo ? `<div class="item_ammo_count"><i class="fa-solid fa-crosshairs"></i> ${item.data.ammo}</div>` : '';
                slots += `
                    <div class="slot other_item_slot" data-item-id="${item.item_id}" data-index="${i}" data-inventory="other">
                        <img src="assets/images/${item.image}" alt="${item.label}" />
                        <div class="item_quantity">${item.quantity}x</div>
                        ${quality_bar}
                        ${ammo_display}
                    </div>
                `;
            } else {
                slots += `<div class="slot other_empty_slot" data-id="" data-index="${i}" data-inventory="other"></div>`;
            }
        }
        const weight_percentage = (other_inventory.current_weight / other_inventory.carry_weight) * 100;
        const content = `
            <div class="other_inventory">
                <div class="slot_inventory_header">
                    <h3>${other_inventory.id}</h3>
                </div>
                <div class="slot_weight_bar_container" id="other_inventory_weight">
                    <div class="slot_weight_bar" style="position: relative;">
                        <div class="slot_weight" style="width: ${weight_percentage}%; transition: width 0.5s;">
                            <div class="other_weight_tooltip">${(other_inventory.current_weight / 1000).toFixed(2)}/${(other_inventory.carry_weight / 1000).toFixed(2)}kg</div>
                        </div>
                    </div>
                </div>
                <div class="slot_inventory_container">
                    <div class="slots">
                        ${slots}
                    </div>
                </div>
                <div class="item_info_container" id="other_item_info"></div>
            </div>
        `;
        return content;
    }

    setup_draggable() {
        const self = this;
    
        $(".item_slot, .other_item_slot").draggable({
            revert: function (event, ui) {
                return !event;
            },
            revertDuration: 200,
            zIndex: 1000,
            start: function (event, ui) {
                self.original_index = $(this).data("index");
                $(this).addClass('dragging');
                console.log('Dragging started', self.original_index);
            },
            stop: function (event, ui) {
                $(this).removeClass('dragging');
                console.log('Dragging stopped', self.original_index);
            }
        });
    
        $(".empty_slot, .other_empty_slot").droppable({
            accept: ".item_slot, .other_item_slot",
            classes: {
                "ui-droppable-hover": "highlight"
            },
            drop: function (event, ui) {
                const dropped_on = $(this);
                const dragged_item = ui.draggable;
                const original_slot_index = dragged_item.data("index");
                const new_slot_index = dropped_on.data("index");
                const from_inventory = dragged_item.data("inventory");
                const to_inventory = dropped_on.data("inventory");
                if (new_slot_index !== original_slot_index || from_inventory !== to_inventory) {
                    let moved_item;
                    let moved_item_weight;
                    if (from_inventory === 'player') {
                        moved_item = self.player_inventory.items.find(item => item.slot === original_slot_index + 1);
                        moved_item_weight = moved_item.weight * moved_item.quantity;
                    } else {
                        moved_item = self.other_inventory.items.find(item => item.slot === original_slot_index + 1);
                        moved_item_weight = moved_item.weight * moved_item.quantity;
                    }
                    if (to_inventory === 'player' && (self.player_inventory.current_weight + moved_item_weight > self.player_inventory.carry_weight)) {
                        console.log("Cannot move item, exceeds player's carry weight limit.");
                        dragged_item.draggable('option', 'revert', true);
                        return;
                    } else if (to_inventory === 'other' && (self.other_inventory.current_weight + moved_item_weight > self.other_inventory.carry_weight)) {
                        console.log("Cannot move item, exceeds other inventory's carry weight limit.");
                        dragged_item.draggable('option', 'revert', true);
                        return;
                    }
                    if (from_inventory === 'player') {
                        self.player_inventory.current_weight -= moved_item_weight;
                        self.player_inventory.items = self.player_inventory.items.filter(item => item.slot !== original_slot_index + 1);
                    } else {
                        self.other_inventory.current_weight -= moved_item_weight;
                        self.other_inventory.items = self.other_inventory.items.filter(item => item.slot !== original_slot_index + 1);
                    }
                    if (moved_item) {
                        moved_item.slot = new_slot_index + 1;
                        if (to_inventory === 'player') {
                            self.player_inventory.items.push(moved_item);
                            self.player_inventory.current_weight += moved_item_weight;
                            if (from_inventory !== to_inventory) {
                                display_item_box({ action: 'add', item: moved_item });
                            }
                        } else {
                            self.other_inventory.items.push(moved_item);
                            self.other_inventory.current_weight += moved_item_weight;
                            if (from_inventory !== to_inventory) {
                                display_item_box({ action: 'remove', item: moved_item });
                            }
                        }
                        dropped_on.html(`
                            <img src="assets/images/${moved_item.image}" alt="${moved_item.label}" />
                            <div class="item_quantity">${moved_item.quantity}x</div>
                        `).removeClass("empty_slot").addClass("item_slot").attr("data-item-id", moved_item.id);
                        dragged_item.html("").removeClass("item_slot").addClass("empty_slot").attr("data-id", "").attr("data-index", original_slot_index).attr("data-inventory", from_inventory);
                        self.render_inventory(self.player_inventory, self.other_inventory);
                    }
                    self.track_inventory_state();
                }
            }
        });
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

        $('.item_slot').off('mouseenter mouseleave').hover(
            (event) => {
                const item_id = $(event.currentTarget).data('item-id');
                const item_data = this.player_inventory.items.find(i => i.item_id === item_id);
                this.show_item_info(item_data, 'player_item_info');
            },
            () => {
                this.hide_item_info('player_item_info');
            }
        );

        $('.other_item_slot').off('mouseenter mouseleave').hover(
            (event) => {
                const item_id = $(event.currentTarget).data('item-id');
                const item_data = this.other_inventory.items.find(i => i.item_id === item_id);
                this.show_item_info(item_data, 'other_item_info');
            },
            () => {
                this.hide_item_info('other_item_info');
            }
        );
    }

    setup_context_menu_events() {
        const self = this;

        $(document).on('click keyup', (e) => {
            if (e.type === 'click' || (e.type === 'keyup' && e.key === 'Escape')) {
                $('#context_menu').hide();
            }
        });

        $('.item_slot, .other_item_slot').off('contextmenu').on('contextmenu', (event) => {
            event.preventDefault();
            const item_id = $(event.currentTarget).data('item-id');
            const from_inventory = $(event.currentTarget).data('inventory');
            let item_data;
            if (from_inventory === 'player') {
                item_data = this.player_inventory.items.find(i => i.item_id === item_id);
            } else {
                item_data = this.other_inventory.items.find(i => i.item_id === item_id);
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
            menu.html(`
                <ul>
                    <li id="use_item"><i class="fa-solid fa-hand"></i> Use</li>
                    <li id="drop_item"><i class="fa-solid fa-trash-can"></i> Drop</li>
                    ${split_item}
                    ${reload_item}
                    ${modify_item}
                </ul>
            `);
            menu.css({ top: event.pageY, left: event.pageX }).show();
            $('#use_item').off('click').on('click', () => {
                $.post(`https://${GetParentResourceName()}/use_item`, JSON.stringify({ item_id: item_id }));
                menu.hide();
            });

            $('#drop_item').off('click').on('click', () => {
                $.post(`https://${GetParentResourceName()}/drop_item`, JSON.stringify({ item_id: item_id, quantity: item_data.quantity }));
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
        });
    }

    show_modal(type, item) {
        let modal_body = '';
        if (type === 'split') {
            modal_body = `
                <p>Enter amount to split:</p>
                <div style="display: flex; justify-content: center; align-items: center;">
                    <input type="number" id="split-input" min="1" />
                    <button class="header_btn" id="split-confirm"><i class="fa-solid fa-check"></i></button>
                </div>
            `;
        }
        $('#modal-body').html(modal_body);
        $('#modal').show();
        $('#close-modal').off('click').on('click', () => {
            $('#modal').hide();
        });
        if (type === 'split') {
            $('#split-confirm').off('click').on('click', () => {
                const split_amount = parseInt($('#split-input').val());
                if (split_amount > 0 && split_amount < item.quantity) {
                    this.split_item(item, split_amount);
                    $('#modal').hide();
                } else {
                    console.log('Invalid split amount.');
                }
            });
        }
    }

    split_item(item, split_amount) {
        const available_slot = this.find_next_available_slot();
        if (available_slot !== null) {
            const new_item = {
                ...item,
                quantity: split_amount,
                slot: available_slot + 1
            };
            item.quantity -= split_amount;
            this.player_inventory.items.push(new_item);
            this.render_inventory(this.player_inventory, this.other_inventory);
        } else {
            console.log('No available slot to place the split item.');
        }
    }

    find_next_available_slot() {
        for (let i = 0; i < this.max_slots; i++) {
            if (!this.slots[i]) {
                return i;
            }
        }
        return null;
    }

    show_item_info(item, container_id) {
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
        $(`#${container_id}`).html(item_info).show();
    }

    hide_item_info(container_id) {
        $(`#${container_id}`).hide().empty();
    }
}

//const test_slot_inv = new SlotBased(inv_test_data);