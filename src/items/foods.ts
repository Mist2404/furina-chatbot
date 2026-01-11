import { FoodItem  } from "../types";

export const foods: FoodItem[] = [
  {
    id: "apple",
    name: "红苹果",
    price: 50,
    type: "food",
    description: "普通的红苹果",
    nutrition:{
      hunger:10,
      thirst:10,
      mood:10,
      fatigue:10
    },
    onUse: async (session) => {
      return "你咔哧咔哧吃掉了苹果。";
    },
  },
  {
    id: "banana",
    name: "香蕉",
    price: 30,
    type: "food",
    description: "弯弯的香蕉",
    nutrition:{
      hunger:10,
      thirst:10,
      mood:10,
      fatigue:10
    },
    onUse: async () => "吃完记得不要乱扔香蕉皮。",
  },
];
