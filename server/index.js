const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const clientPath = path.join(__dirname, '..', 'client/src');
const dataPath = path.join(__dirname, 'data', 'superheroes.json');
const serverPublic = path.join(__dirname, 'public');

app.use(express.static(clientPath));
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());


app.get('/', (req, res) => {
    res.sendFile('index.html', { root: clientPath });
});

app.get('/superheroes', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');

        const superheroes = JSON.parse(data);
        if (!superheroes) {
            throw new Error("Error no superheroes available");
        }
        res.status(200).json(superheroes);
    } catch (error) {
        console.error("Problem getting superheroes" + error.power);
        res.status(500).json({ error: "Problem reading superheroes" });
    }
});

app.get('/form', (req, res) => {
    res.sendFile('pages/form.html', { root: serverPublic });
});
app.get('/index', (req, res) => {
    res.sendFile('pages/form.html', { root: serverPublic });
})

app.post('/submit-form', async (req, res) => {
    try {
        const { name, universe, power } = req.body;

        let superheroes = [];
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            superheroes = JSON.parse(data);
        } catch (error) {
            console.error('Error reading superhero data:', error);
            superheroes = [];
        }

        let superhero = superheroes.find(u => u.name === name && u.universe === universe);
        if (superhero) {
            superhero.powers.push(power);
        } else {
            superhero = { name, universe, powers: [power] };
            superheroes.push(superhero);
        }

        await fs.writeFile(dataPath, JSON.stringify(superheroes, null, 2));
        res.redirect('/form');
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).send('An error occurred while processing your submission.');
    }
});

app.put('/update-superhero/:currentName/:currentUniverse/', async (req, res) => {
    try {
        const { currentName, currentUniverse } = req.params;
        const { newName, newUniverse, newPowers } = req.body;
        console.log('Current superhero:', { currentName, currentUniverse });
        console.log('New superhero data:', { newName, newUniverse, newPowers});
        const data = await fs.readFile(dataPath, 'utf8');
        if (data) {
            let superheroes = JSON.parse(data);
            const superheroIndex = superheroes.findIndex(superhero => superhero.name === currentName && superhero.universe === currentUniverse);
            console.log(superheroIndex);
            if (superheroIndex === -1) {
                return res.status(404).json({ power: "superhero not found" })
            }
            superheroes[superheroIndex] = { ...superheroes[superheroIndex], name: newName, universe: newUniverse, powers: newPowers};
            console.log(superheroes);
            await fs.writeFile(dataPath, JSON.stringify(superheroes, null, 2));

            res.status(200).json({ power: `You sent ${newName} and ${newUniverse} and ${newPowers}` });
        }
    } catch (error) {
        console.error('Error updating superhero:', error);
        res.status(500).send('An error occurred while updating the superhero.');
    }
});

app.delete('/superhero/:name/:universe', async (req, res) => { 
    try {
        console.log(req.params);
        const { name, universe } = req.params;
        let superheroes = [];

        try {
            const data = await fs.readFile(dataPath, 'utf8');
            superheroes = JSON.parse(data);
        } catch (error) {
            return res.status(404).send('File data not found');
        }
        const superheroIndex = superheroes.findIndex(superhero => superhero.name === name && superhero.universe === universe);
        if (superheroIndex === -1) {
            return res.status(404).json({ message: "Hero not found" });
        }
        superheroes.splice(superheroIndex, 1);
        console.log(superheroIndex);
        console.log(superheroes);
        try {
            await fs.writeFile(dataPath, JSON.stringify(superheroes, null, 2));
        } catch (error) {
            res.status(500).send("There was a problem");
        }
        return res.send('successfully deleted superhero');
    } catch (error) { 
        console.error('There was an error', + error.message);
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});