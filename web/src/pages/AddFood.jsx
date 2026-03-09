import { useState } from 'react';
import { useCreateNutritionEntry } from '../api/hooks';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function AddFood({ isOpen, onClose, date }) {
  const [mealName, setMealName] = useState('Lunch');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const createEntry = useCreateNutritionEntry();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEntry.mutateAsync({
        date,
        meal_name: mealName,
        food_name: foodName,
        calories: parseInt(calories) || 0,
        protein_grams: parseInt(protein) || 0,
        carb_grams: parseInt(carbs) || 0,
        fat_grams: parseInt(fat) || 0,
      });
      toast.success('Food logged');
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Food">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Meal selector */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-300">Meal</label>
          <div className="flex gap-2">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMealName(m)}
                className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                  mealName === m
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-dark-700 text-gray-500 border border-dark-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Food Name"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          placeholder="e.g. Chicken breast, 6oz"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Calories"
            type="number"
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="280"
            required
          />
          <Input
            label="Protein (g)"
            type="number"
            inputMode="numeric"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="42"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Carbs (g)"
            type="number"
            inputMode="numeric"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="0"
          />
          <Input
            label="Fat (g)"
            type="number"
            inputMode="numeric"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder="6"
          />
        </div>

        <Button type="submit" loading={createEntry.isPending} size="lg" className="w-full">
          Log Food
        </Button>
      </form>
    </Modal>
  );
}
