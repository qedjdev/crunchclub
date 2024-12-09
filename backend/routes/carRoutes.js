const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const User = require('../models/User');

// GET /api/cars/:id
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('user', 'name username profilePicture')
      .populate('owners');

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json(car);
  } catch (error) {
    console.error('Error fetching car:', error); // node
    res.status(500).json({ error: 'Failed to fetch car details' });
  }
});

// POST /api/cars/:id/owners
router.post('/:id/owners', async (req, res) => {
  try {
    const { id } = req.params;
    const { newOwnerId } = req.body;

    // Find the car and new owner
    const [car, newOwner] = await Promise.all([
      Car.findById(id),
      User.findById(newOwnerId)
    ]);

    if (!car || !newOwner) {
      return res.status(404).json({ error: 'Car or user not found' });
    }

    // no duplicates
    if (car.owners.some(owner => owner._id.toString() === newOwnerId)) {
      return res.status(400).json({ error: 'User is already an owner of this car' });
    }

    // add ownership
    car.owners.push({
      _id: newOwnerId,
      name: newOwner.name,
      username: newOwner.username,
      joinedAt: new Date()
    });
    newOwner.ownedCars.push(id);

    await Promise.all([
      car.save(),
      newOwner.save()
    ]);

    const updatedCar = await Car.findById(id)
      .populate('user', 'name username profilePicture')
      .populate('owners');

    res.json(updatedCar);
  } catch (error) {
    console.error('Error adding car owner:', error);
    res.status(500).json({ error: 'Failed to add car owner' });
  }
});

// todo: DRY: helpers

// DELETE /api/cars/:id/owners/:ownerId
router.delete('/:id/owners/:ownerId', async (req, res) => {
  try {
    const { id, ownerId } = req.params;

    const [car, owner] = await Promise.all([
      Car.findById(id),
      User.findById(ownerId)
    ]);

    if (!car || !owner) {
      return res.status(404).json({ error: 'Car or user not found' });
    }

    car.owners = car.owners.filter(owner => owner._id.toString() !== ownerId);
    owner.ownedCars = owner.ownedCars.filter(carId => carId.toString() !== id);

    if (car.owners.length === 0) {
      await Car.findByIdAndDelete(id); // idk if picture gets deleted who cares atp but TODO
      res.json({ message: 'Car deleted - no owners remaining' });
    } else {
      await Promise.all([
        car.save(),
        owner.save()
      ]);

      // Return updated car with populated fields
      const updatedCar = await Car.findById(id)
        .populate('user', 'name username profilePicture')
        .populate('owners');

      res.json(updatedCar);
    }
  } catch (error) {
    console.error('Error removing car owner:', error);
    res.status(500).json({ error: 'Failed to remove car owner' });
  }
});

// PATCH /api/cars/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const car = await Car.findById(id)
      .populate('user', 'name username profilePicture')
      .populate('owners');

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Update description
    car.description = description;
    await car.save();

    res.json(car);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Failed to update car' });
  }
});

module.exports = router; 