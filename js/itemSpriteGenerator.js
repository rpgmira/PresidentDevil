// ============================================
// President Devil — Runtime Item Sprite Generator
// ============================================
// Generates 16×16 pixel-art sprites for all pickable items.
// Each item gets its own texture key: 'item_{type}'
//
// Item types:
//   Weapons:  weapon_knife, weapon_bat, weapon_handgun, weapon_shotgun, weapon_crossbow, weapon_chainsaw
//   Ammo:     ammo_pistol, ammo_shotgun, ammo_crossbow
//   Pickups:  health, key, repair_kit
//   Passives: passive_IRON_BOOTS, passive_ADRENALINE, passive_BLOOD_PACT, passive_QUIET_SHOES, passive_THICK_SKIN
//   Special:  fists, grenade

const ITEM_SPRITE_GEN = {

    FW: 16,
    FH: 16,

    generate(scene) {
        console.log('[ItemSpriteGen] Generating item spritesheets...');

        const items = {
            // Weapons
            weapon_knife:    this._drawKnife.bind(this),
            weapon_bat:      this._drawBat.bind(this),
            weapon_chainsaw: this._drawChainsaw.bind(this),
            weapon_handgun:  this._drawHandgun.bind(this),
            weapon_shotgun:  this._drawShotgun.bind(this),
            weapon_crossbow: this._drawCrossbow.bind(this),
            grenade:         this._drawGrenade.bind(this),
            fists:           this._drawFists.bind(this),
            // Ammo
            ammo_pistol:     this._drawAmmoPistol.bind(this),
            ammo_shotgun:    this._drawAmmoShotgun.bind(this),
            ammo_crossbow:   this._drawAmmoCrossbow.bind(this),
            // Pickups
            health:          this._drawHealth.bind(this),
            key:             this._drawKey.bind(this),
            repair_kit:      this._drawRepairKit.bind(this),
            // Passives
            passive_IRON_BOOTS:   this._drawIronBoots.bind(this),
            passive_ADRENALINE:   this._drawAdrenaline.bind(this),
            passive_BLOOD_PACT:   this._drawBloodPact.bind(this),
            passive_QUIET_SHOES:  this._drawQuietShoes.bind(this),
            passive_THICK_SKIN:   this._drawThickSkin.bind(this),
        };

        for (const [key, drawFn] of Object.entries(items)) {
            const texKey = `item_${key}`;
            const canvas = document.createElement('canvas');
            canvas.width = this.FW;
            canvas.height = this.FH;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            drawFn(ctx);

            if (scene.textures.exists(texKey)) {
                scene.textures.remove(texKey);
            }
            scene.textures.addCanvas(texKey, canvas);
            console.log(`[ItemSpriteGen] ${texKey} created`);
        }

        console.log('[ItemSpriteGen] All item sprites generated.');
    },

    // ── Helpers ──
    _px(ctx, x, y, c) {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
    },
    _rect(ctx, x, y, w, h, c) {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, w, h);
    },

    // ═══════════════════════════════════════════
    // WEAPONS
    // ═══════════════════════════════════════════

    _drawKnife(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Handle (brown wood)
        px(6,12,'#553311'); px(7,12,'#774422'); px(8,12,'#553311');
        px(6,11,'#774422'); px(7,11,'#996633'); px(8,11,'#774422');
        px(7,10,'#996633');
        // Guard (dark metal)
        px(5,9,'#555555'); px(6,9,'#777777'); px(7,9,'#888888'); px(8,9,'#777777'); px(9,9,'#555555');
        // Blade (steel)
        px(7,8,'#aabbcc'); px(7,7,'#bbccdd');
        px(7,6,'#ccddee'); px(8,6,'#aabbcc');
        px(7,5,'#ccddee'); px(8,5,'#99aabb');
        px(7,4,'#bbccdd');
        px(7,3,'#aabbcc');
        // Blade tip
        px(7,2,'#99aabb');
        // Edge highlight
        px(6,5,'#ddeeff'); px(6,6,'#ddeeff'); px(6,7,'#ccddee');
    },

    _drawBat(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Handle (tape grip)
        px(7,14,'#222222'); px(8,14,'#333333');
        px(7,13,'#333333'); px(8,13,'#222222');
        px(7,12,'#222222'); px(8,12,'#333333');
        // Handle transition
        px(7,11,'#886644'); px(8,11,'#774433');
        // Shaft (wood)
        px(6,10,'#996644'); px(7,10,'#aa7755'); px(8,10,'#996644');
        px(6,9,'#aa7755'); px(7,9,'#bb8866'); px(8,9,'#aa7755');
        px(6,8,'#aa7755'); px(7,8,'#bb8866'); px(8,8,'#aa7755'); px(9,8,'#996644');
        // Barrel (wider)
        px(5,7,'#996644'); px(6,7,'#bb8866'); px(7,7,'#ccaa88'); px(8,7,'#bb8866'); px(9,7,'#996644');
        px(5,6,'#aa7755'); px(6,6,'#ccaa88'); px(7,6,'#ddbb99'); px(8,6,'#ccaa88'); px(9,6,'#aa7755');
        px(5,5,'#aa7755'); px(6,5,'#ccaa88'); px(7,5,'#ddbb99'); px(8,5,'#ccaa88'); px(9,5,'#aa7755');
        px(5,4,'#996644'); px(6,4,'#bb8866'); px(7,4,'#ccaa88'); px(8,4,'#bb8866'); px(9,4,'#996644');
        // Top
        px(6,3,'#996644'); px(7,3,'#aa7755'); px(8,3,'#996644');
    },

    _drawChainsaw(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Handle
        px(3,12,'#444444'); px(4,12,'#555555'); px(5,12,'#444444');
        px(3,11,'#555555'); px(4,11,'#666666'); px(5,11,'#555555');
        // Body (orange/grey machine)
        px(3,10,'#cc6600'); px(4,10,'#dd7711'); px(5,10,'#cc6600'); px(6,10,'#888888');
        px(3,9,'#dd7711'); px(4,9,'#ee8822'); px(5,9,'#dd7711'); px(6,9,'#999999');
        px(3,8,'#cc6600'); px(4,8,'#dd7711'); px(5,8,'#cc6600'); px(6,8,'#888888');
        // Blade bar
        px(6,7,'#666666'); px(7,7,'#888888'); px(8,7,'#888888'); px(9,7,'#666666');
        px(6,6,'#777777'); px(7,6,'#999999'); px(8,6,'#999999'); px(9,6,'#777777');
        px(6,5,'#666666'); px(7,5,'#888888'); px(8,5,'#888888'); px(9,5,'#666666');
        px(7,4,'#777777'); px(8,4,'#777777');
        px(7,3,'#666666'); px(8,3,'#666666');
        // Chain teeth
        px(10,7,'#aaaaaa'); px(10,5,'#aaaaaa');
        px(5,6,'#aaaaaa'); px(5,8,'#aaaaaa');
        px(9,3,'#aaaaaa'); px(9,4,'#aaaaaa');
        // Tip
        px(7,2,'#555555'); px(8,2,'#555555');
    },

    _drawHandgun(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Grip
        px(5,12,'#332222'); px(6,12,'#443333'); px(7,12,'#332222');
        px(5,11,'#443333'); px(6,11,'#554444'); px(7,11,'#443333');
        px(5,10,'#332222'); px(6,10,'#443333'); px(7,10,'#332222');
        // Grip texture
        px(6,12,'#3a2a2a');
        // Trigger guard
        px(4,9,'#555555'); px(5,9,'#555555'); px(6,9,'#666666'); px(7,9,'#666666'); px(8,9,'#555555');
        // Trigger
        px(5,10,'#444444');
        // Body / receiver
        px(5,8,'#555555'); px(6,8,'#777777'); px(7,8,'#888888'); px(8,8,'#777777'); px(9,8,'#555555');
        px(5,7,'#666666'); px(6,7,'#888888'); px(7,7,'#999999'); px(8,7,'#888888'); px(9,7,'#666666');
        // Slide
        px(5,6,'#444444'); px(6,6,'#666666'); px(7,6,'#777777'); px(8,6,'#666666'); px(9,6,'#444444');
        // Barrel
        px(6,5,'#555555'); px(7,5,'#666666'); px(8,5,'#555555');
        px(7,4,'#555555');
        px(7,3,'#444444');
        // Muzzle
        px(7,2,'#333333');
        // Sight
        px(6,5,'#ff4400');
    },

    _drawShotgun(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Stock
        px(6,14,'#553311'); px(7,14,'#774422'); px(8,14,'#553311');
        px(6,13,'#774422'); px(7,13,'#886633'); px(8,13,'#774422');
        // Stock-receiver transition
        px(6,12,'#886633'); px(7,12,'#996644'); px(8,12,'#886633');
        // Receiver
        px(6,11,'#555555'); px(7,11,'#777777'); px(8,11,'#555555');
        px(6,10,'#666666'); px(7,10,'#888888'); px(8,10,'#666666');
        // Pump
        px(5,9,'#774422'); px(6,9,'#886633'); px(7,9,'#996644'); px(8,9,'#886633'); px(9,9,'#774422');
        // Barrel
        px(6,8,'#555555'); px(7,8,'#666666'); px(8,8,'#555555');
        px(6,7,'#555555'); px(7,7,'#666666'); px(8,7,'#555555');
        px(7,6,'#555555'); px(8,6,'#555555');
        px(7,5,'#555555'); px(8,5,'#444444');
        px(7,4,'#444444'); px(8,4,'#444444');
        // Muzzle
        px(7,3,'#333333'); px(8,3,'#333333');
        // Double barrel
        px(6,6,'#444444'); px(6,7,'#444444');
    },

    _drawCrossbow(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Stock
        px(7,13,'#553311'); px(8,13,'#774422');
        px(7,12,'#774422'); px(8,12,'#553311');
        // Body
        px(7,11,'#555555'); px(8,11,'#666666');
        px(7,10,'#666666'); px(8,10,'#777777');
        px(7,9,'#555555'); px(8,9,'#666666');
        // Rail
        px(7,8,'#777777'); px(8,8,'#888888');
        // Bow arms
        px(3,7,'#774422'); px(4,7,'#886633'); px(5,7,'#886633'); px(6,7,'#886633');
        px(7,7,'#555555'); px(8,7,'#555555');
        px(9,7,'#886633'); px(10,7,'#886633'); px(11,7,'#886633'); px(12,7,'#774422');
        // Tips
        px(2,6,'#888888'); px(13,6,'#888888');
        px(3,6,'#666666'); px(12,6,'#666666');
        // String
        px(4,8,'#aaaaaa'); px(5,8,'#aaaaaa'); px(6,8,'#aaaaaa');
        px(9,8,'#aaaaaa'); px(10,8,'#aaaaaa'); px(11,8,'#aaaaaa');
        // Bolt
        px(7,6,'#888888'); px(7,5,'#aaaaaa'); px(7,4,'#aaaaaa'); px(7,3,'#bbbbbb');
        // Bolt tip
        px(6,2,'#cccccc'); px(7,2,'#dddddd'); px(8,2,'#cccccc');
    },

    _drawGrenade(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Pin/ring
        px(7,3,'#888888'); px(8,3,'#888888'); px(9,3,'#888888');
        px(9,4,'#888888');
        // Lever
        px(6,3,'#666666'); px(6,4,'#666666'); px(6,5,'#666666');
        // Top cap
        px(7,4,'#334433'); px(8,4,'#445544');
        // Body
        px(6,6,'#334433'); px(7,6,'#445544'); px(8,6,'#556655'); px(9,6,'#445544');
        px(6,7,'#445544'); px(7,7,'#556655'); px(8,7,'#667766'); px(9,7,'#556655');
        px(6,8,'#556655'); px(7,8,'#667766'); px(8,8,'#778877'); px(9,8,'#667766');
        px(6,9,'#445544'); px(7,9,'#556655'); px(8,9,'#667766'); px(9,9,'#556655');
        px(6,10,'#334433'); px(7,10,'#445544'); px(8,10,'#556655'); px(9,10,'#445544');
        // Bottom
        px(7,11,'#334433'); px(8,11,'#334433');
        // Ridges
        px(5,7,'#334433'); px(10,7,'#334433');
        px(5,9,'#334433'); px(10,9,'#334433');
    },

    _drawFists(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Left fist
        px(3,7,'#c4a078'); px(4,7,'#e8c8a0'); px(5,7,'#e8c8a0');
        px(3,8,'#e8c8a0'); px(4,8,'#f0d0a8'); px(5,8,'#e8c8a0');
        px(3,9,'#c4a078'); px(4,9,'#e8c8a0'); px(5,9,'#c4a078');
        px(4,10,'#c4a078');
        // Knuckle line
        px(3,7,'#b09068');
        // Right fist
        px(10,7,'#c4a078'); px(11,7,'#e8c8a0'); px(12,7,'#e8c8a0');
        px(10,8,'#e8c8a0'); px(11,8,'#f0d0a8'); px(12,8,'#e8c8a0');
        px(10,9,'#c4a078'); px(11,9,'#e8c8a0'); px(12,9,'#c4a078');
        px(11,10,'#c4a078');
        // Knuckle line
        px(12,7,'#b09068');
        // Impact lines between fists
        px(7,6,'#ffcc00'); px(8,6,'#ffcc00');
        px(6,8,'#ffaa00'); px(9,8,'#ffaa00');
        px(7,10,'#ffcc00'); px(8,10,'#ffcc00');
    },

    // ═══════════════════════════════════════════
    // AMMO
    // ═══════════════════════════════════════════

    _drawAmmoPistol(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Three bullets in a loose arrangement
        // Bullet 1
        px(4,6,'#cc8833'); px(4,7,'#ddaa44'); px(4,8,'#ddaa44'); px(4,9,'#ddaa44'); px(4,10,'#cc8833');
        px(4,5,'#ccaa88'); // tip
        // Bullet 2
        px(7,5,'#cc8833'); px(7,6,'#ddaa44'); px(7,7,'#ddaa44'); px(7,8,'#ddaa44'); px(7,9,'#cc8833');
        px(7,4,'#ccaa88');
        // Bullet 3
        px(10,7,'#cc8833'); px(10,8,'#ddaa44'); px(10,9,'#ddaa44'); px(10,10,'#ddaa44'); px(10,11,'#cc8833');
        px(10,6,'#ccaa88');
        // Casing details
        px(4,10,'#aa7722'); px(7,9,'#aa7722'); px(10,11,'#aa7722');
    },

    _drawAmmoShotgun(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Two shotgun shells (wider than pistol rounds)
        // Shell 1
        px(4,5,'#cc3333'); px(5,5,'#dd4444');
        px(4,6,'#dd4444'); px(5,6,'#ee5555');
        px(4,7,'#dd4444'); px(5,7,'#ee5555');
        px(4,8,'#dd4444'); px(5,8,'#ee5555');
        px(4,9,'#cc8833'); px(5,9,'#cc8833'); // brass end
        px(4,4,'#888888'); px(5,4,'#888888'); // cap
        // Shell 2
        px(9,6,'#cc3333'); px(10,6,'#dd4444');
        px(9,7,'#dd4444'); px(10,7,'#ee5555');
        px(9,8,'#dd4444'); px(10,8,'#ee5555');
        px(9,9,'#dd4444'); px(10,9,'#ee5555');
        px(9,10,'#cc8833'); px(10,10,'#cc8833');
        px(9,5,'#888888'); px(10,5,'#888888');
    },

    _drawAmmoCrossbow(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Three bolts bundled
        // Bolt 1
        px(5,3,'#888888'); px(5,4,'#777777'); px(5,5,'#777777'); px(5,6,'#777777');
        px(5,7,'#666655'); px(5,8,'#666655'); px(5,9,'#666655'); px(5,10,'#554433');
        px(4,3,'#aaaaaa'); px(6,3,'#aaaaaa'); // tip fletching
        px(4,10,'#886644'); px(6,10,'#886644'); // feathers
        // Bolt 2
        px(8,4,'#888888'); px(8,5,'#777777'); px(8,6,'#777777'); px(8,7,'#777777');
        px(8,8,'#666655'); px(8,9,'#666655'); px(8,10,'#666655'); px(8,11,'#554433');
        px(7,4,'#aaaaaa'); px(9,4,'#aaaaaa');
        px(7,11,'#886644'); px(9,11,'#886644');
        // Bolt 3
        px(11,3,'#888888'); px(11,4,'#777777'); px(11,5,'#777777'); px(11,6,'#777777');
        px(11,7,'#666655'); px(11,8,'#666655'); px(11,9,'#666655'); px(11,10,'#554433');
        px(10,3,'#aaaaaa'); px(12,3,'#aaaaaa');
        px(10,10,'#886644'); px(12,10,'#886644');
    },

    // ═══════════════════════════════════════════
    // PICKUPS
    // ═══════════════════════════════════════════

    _drawHealth(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // White box with red cross
        // Box
        this._rect(ctx, 4, 4, 8, 8, '#dddddd');
        this._rect(ctx, 5, 5, 6, 6, '#eeeeee');
        // Outline
        this._rect(ctx, 4, 4, 8, 1, '#aaaaaa');
        this._rect(ctx, 4, 11, 8, 1, '#aaaaaa');
        this._rect(ctx, 4, 4, 1, 8, '#aaaaaa');
        this._rect(ctx, 11, 4, 1, 8, '#aaaaaa');
        // Red cross
        this._rect(ctx, 7, 5, 2, 6, '#cc2222');
        this._rect(ctx, 5, 7, 6, 2, '#cc2222');
        // Highlight
        px(5,5,'#ffffff'); px(6,5,'#ffffff');
    },

    _drawKey(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Golden key
        // Ring/bow
        px(4,3,'#ccaa22'); px(5,3,'#ccaa22'); px(6,3,'#ccaa22');
        px(3,4,'#ccaa22'); px(4,4,'#ffdd44'); px(5,4,'#ffee66'); px(6,4,'#ffdd44'); px(7,4,'#ccaa22');
        px(3,5,'#ccaa22'); px(4,5,'#ffdd44'); px(5,5,'#000000'); px(6,5,'#ffdd44'); px(7,5,'#ccaa22');
        px(3,6,'#ccaa22'); px(4,6,'#ffdd44'); px(5,6,'#ffee66'); px(6,6,'#ffdd44'); px(7,6,'#ccaa22');
        px(4,7,'#ccaa22'); px(5,7,'#ccaa22'); px(6,7,'#ccaa22');
        // Shaft
        px(5,8,'#ddbb33'); px(6,8,'#ddbb33');
        px(5,9,'#ccaa22'); px(6,9,'#ddbb33');
        px(5,10,'#ddbb33'); px(6,10,'#ccaa22');
        px(5,11,'#ccaa22'); px(6,11,'#ddbb33');
        // Teeth
        px(7,10,'#ccaa22'); px(8,10,'#ccaa22');
        px(7,12,'#ccaa22'); px(8,12,'#ccaa22');
        px(5,12,'#ccaa22'); px(6,12,'#ccaa22');
    },

    _drawRepairKit(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Toolbox (green metal box with wrench icon)
        // Box body
        this._rect(ctx, 3, 6, 10, 6, '#338833');
        this._rect(ctx, 4, 7, 8, 4, '#44aa44');
        // Lid
        this._rect(ctx, 3, 5, 10, 2, '#448844');
        // Handle
        px(6,4,'#666666'); px(7,4,'#888888'); px(8,4,'#888888'); px(9,4,'#666666');
        px(6,3,'#888888'); px(9,3,'#888888');
        // Latch
        px(7,6,'#dddd44'); px(8,6,'#dddd44');
        // Outline
        this._rect(ctx, 3, 5, 10, 1, '#226622');
        this._rect(ctx, 3, 11, 10, 1, '#226622');
        this._rect(ctx, 3, 5, 1, 7, '#226622');
        this._rect(ctx, 12, 5, 1, 7, '#226622');
        // Wrench icon on box
        px(6,8,'#cccccc'); px(7,8,'#cccccc'); px(8,8,'#cccccc');
        px(7,9,'#cccccc');
        px(6,10,'#cccccc'); px(7,10,'#cccccc'); px(8,10,'#cccccc');
    },

    // ═══════════════════════════════════════════
    // PASSIVE ITEMS
    // ═══════════════════════════════════════════

    _drawIronBoots(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Heavy iron boot
        // Shaft
        px(6,4,'#555555'); px(7,4,'#666666'); px(8,4,'#555555');
        px(6,5,'#666666'); px(7,5,'#777777'); px(8,5,'#666666');
        px(6,6,'#555555'); px(7,6,'#666666'); px(8,6,'#555555');
        px(6,7,'#666666'); px(7,7,'#777777'); px(8,7,'#666666');
        // Ankle
        px(5,8,'#555555'); px(6,8,'#666666'); px(7,8,'#777777'); px(8,8,'#666666'); px(9,8,'#555555');
        // Foot
        px(4,9,'#555555'); px(5,9,'#666666'); px(6,9,'#777777'); px(7,9,'#777777'); px(8,9,'#666666'); px(9,9,'#555555'); px(10,9,'#444444');
        px(4,10,'#444444'); px(5,10,'#555555'); px(6,10,'#666666'); px(7,10,'#666666'); px(8,10,'#555555'); px(9,10,'#444444'); px(10,10,'#444444'); px(11,10,'#333333');
        // Sole
        px(3,11,'#333333'); px(4,11,'#444444'); px(5,11,'#444444'); px(6,11,'#444444'); px(7,11,'#444444'); px(8,11,'#444444'); px(9,11,'#444444'); px(10,11,'#333333'); px(11,11,'#333333');
        // Rivets
        px(6,5,'#aaaaaa'); px(8,7,'#aaaaaa');
    },

    _drawAdrenaline(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Syringe
        // Plunger
        px(7,2,'#888888'); px(8,2,'#888888');
        px(7,3,'#aaaaaa'); px(8,3,'#aaaaaa');
        // Barrel (glass with green liquid)
        px(6,4,'#dddddd'); px(7,4,'#88ff88'); px(8,4,'#88ff88'); px(9,4,'#dddddd');
        px(6,5,'#dddddd'); px(7,5,'#66dd66'); px(8,5,'#66dd66'); px(9,5,'#dddddd');
        px(6,6,'#dddddd'); px(7,6,'#44bb44'); px(8,6,'#44bb44'); px(9,6,'#dddddd');
        px(6,7,'#dddddd'); px(7,7,'#44bb44'); px(8,7,'#44bb44'); px(9,7,'#dddddd');
        px(6,8,'#dddddd'); px(7,8,'#228822'); px(8,8,'#228822'); px(9,8,'#dddddd');
        // Finger grips
        px(5,9,'#aaaaaa'); px(6,9,'#aaaaaa'); px(7,9,'#aaaaaa'); px(8,9,'#aaaaaa'); px(9,9,'#aaaaaa'); px(10,9,'#aaaaaa');
        // Narrow tip
        px(7,10,'#cccccc'); px(8,10,'#cccccc');
        px(7,11,'#bbbbbb');
        // Needle
        px(7,12,'#999999');
        px(7,13,'#888888');
    },

    _drawBloodPact(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Dark scroll with blood symbol
        // Scroll body
        this._rect(ctx, 4, 4, 8, 9, '#332211');
        this._rect(ctx, 5, 5, 6, 7, '#443322');
        // Scroll rolls
        this._rect(ctx, 3, 3, 10, 2, '#554433');
        this._rect(ctx, 3, 12, 10, 2, '#554433');
        px(3,3,'#666644'); px(12,3,'#666644');
        px(3,13,'#666644'); px(12,13,'#666644');
        // Blood symbol (pentagram-ish)
        px(7,5,'#cc1111'); px(8,5,'#cc1111');
        px(6,6,'#cc1111'); px(9,6,'#cc1111');
        px(5,7,'#cc1111'); px(7,7,'#882222'); px(8,7,'#882222'); px(10,7,'#cc1111');
        px(6,8,'#cc1111'); px(7,8,'#cc1111'); px(8,8,'#cc1111'); px(9,8,'#cc1111');
        px(6,9,'#cc1111'); px(9,9,'#cc1111');
        px(5,10,'#882222'); px(10,10,'#882222');
    },

    _drawQuietShoes(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Soft cloth shoe/moccasin
        // Shoe body
        px(5,7,'#6644aa'); px(6,7,'#7755bb'); px(7,7,'#8866cc'); px(8,7,'#7755bb');
        px(4,8,'#6644aa'); px(5,8,'#7755bb'); px(6,8,'#8866cc'); px(7,8,'#9977dd'); px(8,8,'#8866cc'); px(9,8,'#6644aa');
        px(4,9,'#5533aa'); px(5,9,'#6644aa'); px(6,9,'#7755bb'); px(7,9,'#8866cc'); px(8,9,'#7755bb'); px(9,9,'#5533aa'); px(10,9,'#5533aa');
        // Sole (soft)
        px(3,10,'#443388'); px(4,10,'#554499'); px(5,10,'#554499'); px(6,10,'#554499'); px(7,10,'#554499'); px(8,10,'#554499'); px(9,10,'#443388'); px(10,10,'#443388'); px(11,10,'#332277');
        // Laces
        px(6,7,'#ddddff'); px(7,8,'#ddddff');
        // Muffled effect (wave lines below)
        px(4,12,'#9977dd'); px(6,12,'#9977dd'); px(8,12,'#9977dd'); px(10,12,'#9977dd');
        px(5,13,'#7755bb'); px(7,13,'#7755bb'); px(9,13,'#7755bb');
    },

    _drawThickSkin(ctx) {
        const px = (x,y,c) => this._px(ctx,x,y,c);
        // Shield / armor piece
        // Shield top
        px(5,3,'#886622'); px(6,3,'#aa8833'); px(7,3,'#bbaa44'); px(8,3,'#bbaa44'); px(9,3,'#aa8833'); px(10,3,'#886622');
        // Shield body
        px(4,4,'#886622'); px(5,4,'#aa8833'); px(6,4,'#ccbb55'); px(7,4,'#ddcc66'); px(8,4,'#ddcc66'); px(9,4,'#ccbb55'); px(10,4,'#aa8833'); px(11,4,'#886622');
        px(4,5,'#886622'); px(5,5,'#bbaa44'); px(6,5,'#ddcc66'); px(7,5,'#eedd77'); px(8,5,'#eedd77'); px(9,5,'#ddcc66'); px(10,5,'#bbaa44'); px(11,5,'#886622');
        px(4,6,'#886622'); px(5,6,'#bbaa44'); px(6,6,'#ddcc66'); px(7,6,'#eedd77'); px(8,6,'#eedd77'); px(9,6,'#ddcc66'); px(10,6,'#bbaa44'); px(11,6,'#886622');
        px(4,7,'#886622'); px(5,7,'#aa8833'); px(6,7,'#ccbb55'); px(7,7,'#ddcc66'); px(8,7,'#ddcc66'); px(9,7,'#ccbb55'); px(10,7,'#aa8833'); px(11,7,'#886622');
        px(5,8,'#886622'); px(6,8,'#aa8833'); px(7,8,'#ccbb55'); px(8,8,'#ccbb55'); px(9,8,'#aa8833'); px(10,8,'#886622');
        px(6,9,'#886622'); px(7,9,'#aa8833'); px(8,9,'#aa8833'); px(9,9,'#886622');
        px(7,10,'#886622'); px(8,10,'#886622');
        // Cross emblem
        px(7,5,'#ffffff'); px(8,5,'#ffffff');
        px(7,6,'#ffffff'); px(8,6,'#ffffff');
        px(6,6,'#ffffff'); px(9,6,'#ffffff');
        px(7,7,'#ffffff'); px(8,7,'#ffffff');
    },

    // ── Utility: get texture key for a spawn/item type ──
    getTextureKey(type) {
        // Direct match (e.g., 'health', 'key', 'repair_kit', 'ammo_pistol', 'weapon_knife')
        if (type === 'health' || type === 'key' || type === 'repair_kit' ||
            type.startsWith('ammo_') || type.startsWith('weapon_') ||
            type.startsWith('passive_') || type === 'grenade' || type === 'fists') {
            return `item_${type}`;
        }
        return null;
    },

    // Get texture key from inventory item object
    getTextureKeyForItem(item) {
        if (!item) return null;
        if (item.weapon) {
            // Map weapon name to type
            const map = {
                'Fists': 'fists', 'Knife': 'weapon_knife', 'Baseball Bat': 'weapon_bat',
                'Chainsaw': 'weapon_chainsaw', 'Handgun': 'weapon_handgun',
                'Shotgun': 'weapon_shotgun', 'Crossbow': 'weapon_crossbow',
                'Grenade': 'grenade'
            };
            const key = map[item.weapon.name];
            return key ? `item_${key}` : null;
        }
        if (item.type) {
            return this.getTextureKey(item.type);
        }
        return null;
    }
};
