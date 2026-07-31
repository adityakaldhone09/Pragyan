# Roadmap Builder - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start Backend Server
```bash
cd backend
npm run dev
```
Expected output: `🚀 Pragyan Backend Server Running - Port: 3000`

### Step 2: Start Frontend Server
```bash
cd frontend
npm run dev
```
Expected output: `Local: http://localhost:5173/`

### Step 3: Access the Application
```
Open Browser → http://localhost:5173/admin/roadmaps
```

You should see:
- ✅ "Roadmap Builder" heading
- ✅ Sidebar with "Careers" list
- ✅ Search box
- ✅ "+ New Career" button

---

## 📝 How to Build a Roadmap

### Example: Creating a "Python for Beginners" Roadmap

**1. Create Career**
```
Click: + New Career
Fill in:
  Title: "Python for Beginners"
  Description: "Learn Python programming from scratch"
Click: Save
```

**2. Add Module**
```
Select career → Click: + Add Module
Fill in:
  Title: "Python Basics"
  Description: "Variables, data types, operators"
Click: Save
```

**3. Add Week**
```
Expand Module → Click: + Add Week
Fill in:
  Number: 1
  Title: "Variables & Data Types"
Click: Save
```

**4. Add Day**
```
Expand Week → Click: + Add Day
Fill in:
  Number: 1
  Title: "Understanding Variables"
  Hours: 8
Click: Save
```

**5. Add Topic**
```
Expand Day → Click: + Add Topic
Fill in:
  Title: "Variable Declaration"
  Description: "How to create and use variables"
  Objective: "Master variable syntax"
Click: Save
```

**6. Add Resource**
```
Expand Topic → Click: + Add Resource
Fill in:
  Title: "Python Variables Tutorial"
  URL: https://www.example.com/...
  Provider: "YouTube"
Click: Save
```

**7. Publish**
```
Click: Publish button
→ Career status changes from "Draft" to "Published"
```

---

## 🎯 Common Tasks

### Edit Any Item
1. Find the item in the tree
2. Click **[Edit]** button
3. Modify details in modal
4. Click **Save**

### Delete Any Item
1. Find the item
2. Click **[Del]** button (or **[X]**)
3. Item is immediately removed
4. Toast shows confirmation

### Search Careers
1. Type in search box
2. List filters automatically
3. Clear box to show all

### Publish a Career
1. Select career
2. Click **Publish** button
3. Status changes to "Published"

### See Details
1. Click any career
2. Right panel shows all info
3. Expand sections to see contents

---

## ⚡ Tips & Tricks

### Keyboard Navigation
- **Tab**: Move between buttons
- **Enter**: Activate button/save
- **Escape**: Close modal (after save)

### Quick Actions
- Search first to find careers fast
- Double-click chevron to toggle expand
- Check hour estimates for day planning

### Best Practices
- Use consistent naming (e.g., "Week 1", "Day 1")
- Set realistic hour estimates
- Use descriptive titles and descriptions
- Test URLs before saving resources

---

## 🐛 Troubleshooting

### Problem: Page shows "Select a career to view details"
**Solution**: 
- Click a career in the sidebar
- Or create a new one with "+ New Career"

### Problem: Can't save after typing
**Solution**:
- Check that required fields (Title) are filled
- Look for error message in red
- Clear any validation errors and retry

### Problem: Careers not loading
**Solution**:
- Check backend is running (port 3000)
- Open browser console (F12) and check Network tab
- Refresh page (F5)
- Check if MongoDB is connected

### Problem: Changes not showing
**Solution**:
- Click Refresh button
- Or refresh page (F5)
- Check browser console for errors

### Problem: Button shows spinner but won't save
**Solution**:
- Check backend is responding
- Wait 5-10 seconds (API might be slow)
- Check network connectivity
- Try again with cleaner data

---

## 📊 Data Hierarchy Reference

```
Career (Main entity)
  ↓
Module (Collection of related weeks)
  ↓
Week (7-day period)
  ↓
Day (Individual learning day)
  ↓
Topic (Specific subject)
  ↓
Resource (Learning link - Udemy, YouTube, etc.)
```

### Quick Example
```
Python for Beginners (Career)
  ↓
Module 1: Basics
  ↓
Week 1
  ↓
Day 1
  ↓
Topic 1: Variables
  ↓
Resource: https://udemy.com/python-variables
```

---

## 🔗 Important URLs

| Page | URL |
|------|-----|
| Roadmap Builder | http://localhost:5173/admin/roadmaps |
| Backend API | http://localhost:3000 |
| Frontend Dev | http://localhost:5173 |

---

## 📚 Documentation

### For More Info, See:
- `frontend/docs/ROADMAP_BUILDER.md` - Full feature guide
- `frontend/docs/ROADMAP_BUILDER_TESTING.md` - Testing procedures
- `frontend/IMPLEMENTATION_SUMMARY.md` - Technical summary
- `frontend/ARCHITECTURE.md` - System architecture

---

## ✅ Production Checklist

Before going live, verify:
- [ ] All careers created
- [ ] All modules added
- [ ] All weeks defined
- [ ] All days scheduled
- [ ] All topics listed
- [ ] All resources linked
- [ ] All careers published
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Tested on desktop and mobile
- [ ] All typos fixed
- [ ] Links tested

---

## 🆘 Need Help?

### Check These First
1. Is backend running? (Port 3000)
2. Is frontend running? (Port 5173)
3. Are there console errors? (F12)
4. Did you save the career first?

### Common Causes
- **Not saving**: Click Save button in modal
- **Can't add modules**: Select a career first
- **API errors**: Check backend running
- **UI not updating**: Try F5 refresh

### Contact Support
1. Check documentation
2. Review browser console
3. Check backend logs
4. Contact development team

---

## 🎓 Example Roadmaps

### Web Development Roadmap
```
Career: Full Stack Web Development
├─ Module 1: Frontend Basics
│  ├─ Week 1: HTML & CSS
│  ├─ Week 2: JavaScript Fundamentals
│  └─ Week 3: React Basics
├─ Module 2: Backend Development
│  ├─ Week 4: Node.js & Express
│  └─ Week 5: Database Design
└─ Module 3: Deployment
   └─ Week 6: Docker & AWS
```

### Data Science Roadmap
```
Career: Data Science Fundamentals
├─ Module 1: Python Programming
├─ Module 2: Data Analysis
├─ Module 3: Machine Learning
└─ Module 4: Advanced Topics
```

---

## 📈 Usage Statistics

Track:
- Total careers created
- Total modules built
- Average hours per day
- Popular resources
- Completion rates

---

## 🔐 Security Notes

✅ **Safe to Use**:
- All data validated
- Authenticated access
- Admin-only feature
- Protected against common attacks

⚠️ **Remember**:
- Don't share admin URLs publicly
- Keep authentication tokens private
- Test in development first
- Backup data before major changes

---

## 🎉 You're Ready!

Now you can:
1. ✅ Create careers
2. ✅ Build roadmaps
3. ✅ Add learning modules
4. ✅ Publish to students
5. ✅ Manage content

Start with the Quick Start Guide above, or dive into Full Documentation for advanced features.

---

**Last Updated**: July 24, 2026  
**Version**: 1.0  
**Status**: Production Ready ✅

**Happy Building! 🚀**
