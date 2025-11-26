import { Ingredient, DishItem, FullMenu } from './storage';

export function generateFullMenu(mainDishName: string, mainDishIngredients: Ingredient[], familySize: number): FullMenu {
  const isRiceDish = ['オムライス', 'チャーハン', 'カレーライス', 'ドリア', '親子丼', '牛丼', '天丼', '豚キムチ'].includes(mainDishName);
  const isWesternDish = ['ハンバーグ', 'グラタン', 'ステーキ', 'パスタカルボナーラ', 'オムライス'].includes(mainDishName);
  const isNoodleDish = ['パスタカルボナーラ'].includes(mainDishName);

  const dishes: DishItem[] = [];

  if (!isRiceDish && !isNoodleDish) {
    if (isWesternDish) {
      dishes.push({
        category: '主食',
        name: 'パン',
        ingredients: [
          { name: 'パン', qty: familySize * 1, unit: '個' }
        ]
      });
    } else {
      dishes.push({
        category: '主食',
        name: 'ご飯',
        ingredients: [
          { name: '米', qty: familySize * 150, unit: 'g' }
        ]
      });
    }
  }

  dishes.push({
    category: '主菜',
    name: mainDishName,
    ingredients: mainDishIngredients
  });

  if (isWesternDish) {
    dishes.push({
      category: '副菜',
      name: 'グリーンサラダ',
      ingredients: [
        { name: 'レタス', qty: Math.ceil(familySize * 0.25), unit: '個' },
        { name: 'トマト', qty: Math.ceil(familySize * 0.5), unit: '個' },
        { name: 'きゅうり', qty: Math.ceil(familySize * 0.3), unit: '本' },
        { name: 'ドレッシング', qty: familySize * 15, unit: 'ml' }
      ]
    });
  } else {
    dishes.push({
      category: '副菜',
      name: 'ほうれん草のおひたし',
      ingredients: [
        { name: 'ほうれん草', qty: Math.ceil(familySize * 0.5), unit: '束' },
        { name: 'かつお節', qty: familySize * 2, unit: 'g' },
        { name: '醤油', qty: familySize * 5, unit: 'ml' }
      ]
    });
  }

  if (isWesternDish) {
    dishes.push({
      category: '汁物',
      name: 'コンソメスープ',
      ingredients: [
        { name: 'コンソメ', qty: Math.ceil(familySize * 0.5), unit: '個' },
        { name: '玉ねぎ', qty: Math.ceil(familySize * 0.3), unit: '個' },
        { name: 'にんじん', qty: Math.ceil(familySize * 0.3), unit: '本' }
      ]
    });
  } else {
    dishes.push({
      category: '汁物',
      name: '味噌汁',
      ingredients: [
        { name: '味噌', qty: familySize * 15, unit: 'g' },
        { name: '木綿豆腐', qty: Math.ceil(familySize * 0.5), unit: '丁' },
        { name: 'わかめ', qty: familySize * 5, unit: 'g' }
      ]
    });
  }

  return { dishes };
}

export function getAllIngredientsFromFullMenu(fullMenu: FullMenu): Ingredient[] {
  const allIngredients: Ingredient[] = [];

  fullMenu.dishes.forEach(dish => {
    allIngredients.push(...dish.ingredients);
  });

  return allIngredients;
}

export function getAllIngredientsWithCategoryFromFullMenu(fullMenu: FullMenu): Array<Ingredient & { category: string; dishName: string }> {
  const allIngredients: Array<Ingredient & { category: string; dishName: string }> = [];

  fullMenu.dishes.forEach(dish => {
    dish.ingredients.forEach(ingredient => {
      allIngredients.push({
        ...ingredient,
        category: dish.category,
        dishName: dish.name
      });
    });
  });

  return allIngredients;
}

export function getMainDish(fullMenu: FullMenu): DishItem | undefined {
  return fullMenu.dishes.find(dish => dish.category === '主菜');
}

interface CookingHistoryRecord {
  dish_name: string;
  cooked_date: string;
  rank?: string;
  overall_score?: number;
  repeat_desire?: number;
}

export function calculateDishWeight(
  dishName: string,
  cookingHistory: CookingHistoryRecord[],
  isFavorite: boolean
): number {
  let weight = 1.0;

  const dishHistory = cookingHistory.filter(h => h.dish_name === dishName);

  if (dishHistory.length > 0) {
    const latestRecord = dishHistory.sort((a, b) =>
      new Date(b.cooked_date).getTime() - new Date(a.cooked_date).getTime()
    )[0];

    if (latestRecord.repeat_desire) {
      switch (latestRecord.repeat_desire) {
        case 5:
          weight *= 3.5;
          break;
        case 4:
          weight *= 2.0;
          break;
        case 3:
          weight *= 1.2;
          break;
        case 2:
          weight *= 0.5;
          break;
        case 1:
          weight *= 0.2;
          break;
      }
    } else if (latestRecord.rank) {
      switch (latestRecord.rank) {
        case 'A':
          weight *= 3.0;
          break;
        case 'B':
          weight *= 1.5;
          break;
        case 'C':
          weight *= 1.0;
          break;
        case 'D':
          weight *= 0.3;
          break;
      }
    }

    const daysSinceLastCooked = Math.floor(
      (Date.now() - new Date(latestRecord.cooked_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastCooked < 7) {
      weight *= 0.3;
    } else if (daysSinceLastCooked < 14) {
      weight *= 0.6;
    } else if (daysSinceLastCooked > 30) {
      weight *= 1.3;
    }
  } else {
    weight *= 1.1;
  }

  if (isFavorite) {
    weight *= 2.0;
  }

  return weight;
}

export function selectWeightedRandomDish(
  dishes: Array<{ name: string; weight: number }>,
  excludeDishes: string[] = []
): string {
  const availableDishes = dishes.filter(d => !excludeDishes.includes(d.name));

  if (availableDishes.length === 0) {
    return dishes[Math.floor(Math.random() * dishes.length)].name;
  }

  const totalWeight = availableDishes.reduce((sum, d) => sum + d.weight, 0);
  let random = Math.random() * totalWeight;

  for (const dish of availableDishes) {
    random -= dish.weight;
    if (random <= 0) {
      return dish.name;
    }
  }

  return availableDishes[availableDishes.length - 1].name;
}
