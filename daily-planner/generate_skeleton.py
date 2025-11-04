"""
BurnRate Timeline Skeleton Generator
Programmatically generates the meal timeline using research-based formulas.
This is called BEFORE the AI to provide a mathematically accurate skeleton.
"""

import json
import subprocess
import os

def generate_skeleton_via_node(athlete, workouts, locked_meals, calculated_targets):
    """
    Call the workout-meal-calculator.js via Node.js to generate timeline skeleton
    
    Args:
        athlete: Athlete profile dict
        workouts: List of workout dicts
        locked_meals: List of locked meal dicts
        calculated_targets: Daily macro targets dict
    
    Returns:
        dict: Timeline skeleton with all entries pre-calculated
    """
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Read the workout meal calculator
    calc_file = os.path.join(script_dir, 'workout-meal-calculator.js')
    with open(calc_file, 'r') as f:
        calc_code = f.read()
    
    # Create Node.js wrapper
    wrapper = f"""
// Import the calculator code
{calc_code}

// Run calculation
const athlete = {json.dumps(athlete)};
const workouts = {json.dumps(workouts)};
const lockedMeals = {json.dumps(locked_meals)};
const targets = {json.dumps(calculated_targets)};

const result = generateTimelineSkeleton(athlete, workouts, lockedMeals, targets);
console.log(JSON.stringify(result));
"""
    
    # Write temporary Node.js script
    temp_file = os.path.join(script_dir, 'temp_skeleton_calc.js')
    with open(temp_file, 'w') as f:
        f.write(wrapper)
    
    try:
        # Run with Node.js
        result = subprocess.run(
            ['node', temp_file],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0:
            raise Exception(f"Node.js calculation failed: {result.stderr}")
        
        # Parse result
        skeleton = json.loads(result.stdout.strip())
        return skeleton
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)

if __name__ == '__main__':
    # Test with example data
    test_athlete = {
        'weight_kg': 70,
        'height_cm': 175,
        'gender': 'male',
        'meals_per_day': 4,
        'sweat_rate': 1000
    }
    
    test_workouts = [
        {
            'type': 'swim',
            'duration_min': 75,
            'intensity': 'moderate',
            'startTime': '05:30',
            'temp_c': 28,
            'humidity_pct': 70
        },
        {
            'type': 'bike',
            'duration_min': 120,
            'intensity': 'high',
            'startTime': '09:00',
            'temp_c': 30,
            'humidity_pct': 65
        }
    ]
    
    test_locked = [
        {
            'time': '12:30',
            'name': 'Team Lunch',
            'carbs': 100,
            'protein': 30,
            'fat': 15,
            'sodium': 800,
            'hydration': 500
        }
    ]
    
    test_targets = {
        'daily_energy_target_kcal': 3200,
        'daily_carb_target_g': 700,
        'daily_protein_target_g': 126,
        'daily_fat_target_g': 56,
        'sodium_target_mg': 5400,
        'hydration_target_l': 4.6
    }
    
    skeleton = generate_skeleton_via_node(test_athlete, test_workouts, test_locked, test_targets)
    print(json.dumps(skeleton, indent=2))

