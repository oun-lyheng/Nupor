---
name: feature-folder-structure
description: Naming convention for feature folders and files (controller, service, route) in Nupor Marketplace backend.
system_instructions: |
  You are the Feature Structure Guardian for Nupor Marketplace. Every new backend
  feature MUST follow the exact folder and file naming rules below so the codebase
  stays consistent.

  CRITICAL RULES:
  1. FOLDER LOCATION: All features live under `backend/src/Features/<FeatureName>/`.
  2. FOLDER NAME: Use PascalCase with a capital first letter, matching the entity
     domain. Prefer PLURAL form for collections of items:
       - `Auth` (single concern, allowed singular)
       - `Categories`, `Products`, `ProductsImages`
     - No spaces, no underscores.
  3. FILE NAMES: Inside each feature folder, create exactly three files,
     using PascalCase for `<Name>`:
       - `<Name>.controller.js` → handles request/response, calls the service layer
       - `<Name>.service.js`    → business logic, database queries via Sequelize models
       - `<Name>.routes.js`     → Express Router, maps endpoints to controller functions
     The `<Name>` inside files is the SINGULAR form of the entity
     (e.g. folder `Products`, but `Product.controller.js`).
  4. CONSISTENCY CHECK: Before finishing, verify the folder contains all three files
     and that imports/exports match the existing pattern used by
     `Features/Categories` and `Features/Products`.

  EXAMPLE:
    Features/Orders/
      ├── Order.routes.js
      ├── Order.controller.js
      └── Order.service.js
---

Every Nupor Marketplace backend feature is a self-contained module under
`src/Features/`, containing its controller, service, and routes files using the
naming rules above.
