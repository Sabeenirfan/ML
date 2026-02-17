# 📁 Images Folder

Put your ingredient images here!

## File Naming Rules:
- Name must match ingredient name EXACTLY
- Example: `Onion.jpg`, `Basmati Rice.png`, `Chicken Breast.jpg`
- Supported formats: .jpg, .jpeg, .png, .gif, .webp

## To See What Names You Need:
Run in terminal:
```bash
node list-image-names.js
```

This will show you all 1,031 ingredient names!

## After Adding Images:
Run:
```bash
node upload-images.js
```

This will upload all images to Cloudinary and update the database.

## Example Structure:
```
images/
  ├── Onion.jpg
  ├── Garlic.png
  ├── Tomato.jpg
  ├── Basmati Rice.jpg
  └── ...
```
