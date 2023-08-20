const express = require('express');
const router = express.Router();
var fetchuser = require('../middleware/fetchuser')
const Note = require('../models/Note')
const { body, validationResult } = require('express-validator');

//Route1: Get all notes using: GET /auth/notes/getuser. Login required
router.get('/fetchallnotes', fetchuser, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id })
        res.json(notes)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
})

//Route2: add notes using: GET /auth/notes/addnote. Login required
router.post('/addnote', fetchuser, [
    body('title', 'Enter a valid title').isLength({ min: 3 }),
    body('description', 'Enter a valid description').isLength({ min: 5 })
], async (req, res) => {

    try {
        const { title, description, tag } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array });
        }

        const note = new Note({
            title, description, tag, user: req.user.id
        })
        const savedNote = await note.save();

        res.json(savedNote)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
})

//Route 3: Update an existing note using: PUT "/api/notes/updatenote". Login required
router.put('/updatenote/:id', fetchuser, async (req, res) => {
    const { title, description, tag } = req.body;
    //Create a newnote object
    const newnote = {};
    if (title) {
        newnote.title = title;
    }
    if (title) {
        newnote.description = description;
    }
    if (title) {
        newnote.tag = tag;
    }

    let note = await Note.findById(req.params.id);
    if (!note) {
        return res.status(404).send("Not found")
    }

    if (note.user.toString() !== req.user.id) {
        return res.status(401).send("Not allowed");
    }

    note = await Note.findByIdAndUpdate(req.params.id, { $set: newnote }, { new: true })
    res.json({ note });
})

//Route 4: Delete an existing note using: delete "/api/notes/deletenote". Login required
router.delete('/deletenote/:id', fetchuser, async (req, res) => {

    try {
        //find a note to be deleted and delete it.
        let note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).send("Not found")
        }

        // Allow deletion only if user owns this Note
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not allowed");
        }

        note = await Note.findByIdAndDelete(req.params.id)
        res.json({ "Success": "note has been deleted", note: note });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error occured")
    }
})

module.exports = router