🎯 Cara Menambah Menu Baru:

Opsi 1: Via Database (Manual) 🗄️

Insert langsung ke tabel menu_items:

INSERT INTO menu_items (id, name, display_name, path, icon, order_index, is_active)
VALUES (
gen_random_uuid(),
'reports',           -- nama internal (lowercase, no space)
'Reports',           -- nama tampilan
'/reports',          -- path route
'bi-file-text',      -- icon bootstrap
10,                  -- urutan menu
true                 -- aktif/tidak
);

Setelah itu, assign menu ke role:
-- Assign ke role admin
INSERT INTO role_menus (id, role_id, menu_item_id)
SELECT gen_random_uuid(), r.id, m.id
FROM roles r, menu_items m
WHERE r.name = 'admin' AND m.name = 'reports';

Opsi 2: Via Migration 📝

Buat migration baru setiap ada menu baru:

# migrations/000010_add_reports_menu.up.sql

INSERT INTO menu_items (id, name, display_name, path, icon, order_index, is_active)
VALUES (gen_random_uuid(), 'reports', 'Reports', '/reports', 'bi-file-text', 10, true);

-- Auto-assign ke admin
INSERT INTO role_menus (id, role_id, menu_item_id)
SELECT gen_random_uuid(), r.id, m.id
FROM roles r, menu_items m
WHERE r.name = 'admin' AND m.name = 'reports';

Opsi 3: Via Admin UI (RECOMMENDED) 🎨

Saya bisa buatkan Menu Management Page untuk admin! Dengan fitur:

- ✅ List semua menu items dengan sorting & pagination
- ✅ Create menu baru via form
- ✅ Edit menu (ubah display name, icon, order, dll)
- ✅ Delete menu yang tidak dipakai
- ✅ Toggle active/inactive menu
- ✅ Drag & drop reorder (opsional)
- ✅ Preview icon dari Bootstrap Icons

Backend sudah ready! Endpoint-nya sudah ada:
- GET /api/menus - List all menus
- POST /api/menu - Create menu
- GET /api/menu/:id - Get menu by ID
- PUT /api/menu/:id - Update menu
- DELETE /api/menu/:id - Delete menu

Yang perlu dibuat hanya frontend UI-nya.

  ---
🚀 Mau Saya Buatkan Menu Management UI?

Jika ya, saya akan buat:

MenuList.jsx

- Table menu items
- Columns: Name, Display Name, Path, Icon (preview), Order, Active Status
- Actions: Edit, Delete, Toggle Active
- Button: Add New Menu

MenuForm.jsx

- Form fields:
    * Name (internal identifier)
    * Display Name (yang tampil di sidebar)
    * Path (route path)
    * Icon (dropdown Bootstrap Icons dengan preview)
    * Order Index (urutan menu)
    * Active Status (toggle)
- Preview real-time menu item
- Save button

Routes di App.jsx

/menus - List menus (admin only)
/menus/new - Create menu (admin only)
/menus/:id/edit - Edit menu (admin only)

  ---
📋 Workflow Setelah Ada Menu Management UI:

1. Admin login → Buka menu "Menus"
2. Click "Add New Menu"
3. Isi form:
   - Name: reports
   - Display Name: Reports
   - Path: /reports
   - Icon: bi-file-text (pilih dari dropdown dengan preview)
   - Order: 10
   - Active: ✅
4. Click "Save" → Menu created!
5. Assign ke roles di halaman Role Management
6. Users dengan role tersebut langsung bisa lihat menu baru

  ---

📋 Workflow Lengkap - Menambah Menu Baru:

Skenario: Admin ingin tambah menu "Reports"

1. Admin Login → Klik menu "Menus"
2. Klik "Add New Menu"
3. Isi Form:
   - Name: reports
   - Display Name: Reports
   - Path: /reports
   - Icon: Click "Pick" → Pilih 📄 (bi-file-text)
   - Parent Menu: None
   - Order: 11
   - Active: ✅
4. Preview Muncul:
   📄 Reports
   /reports
5. Click "Create" → Success!
6. Assign ke Roles:
   - Buka /roles
   - Edit role "Manager"
   - Checklist menu "Reports"
   - Save
7. User dengan role Manager login → Menu "Reports" muncul!
8. Nanti, buat halaman actual:
   - Buat ReportList.jsx
   - Tambah route di App.jsx: /reports
   - User bisa akses halaman Reports

  ---