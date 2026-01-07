import { useState } from 'react';
import {
  Clock,
  Users,
  ChefHat,
  Heart,
  Share2,
  Printer,
  Bookmark,
  Play,
  Minus,
  Plus,
  ArrowRight,
  Flame,
  MessageCircle,
  MoreHorizontal,
  Utensils,
  Check,
  Star,
  ShieldCheck,
  Zap,
  ChevronDown,
  ShoppingCart,
  GitFork,
  MessageSquare,
  FilePen,
  User
} from 'lucide-react';
import { cn } from '../../../lib/utils';

// Mock Data for the Recipe Detail
const RECIPE = {
  title: "Creamy Tuscan Garlic Shrimp",
  author: "Chef Isabella",
  authorAvatar: "https://i.pravatar.cc/150?u=isa",
  time: "25 min",
  servings: 4,
  difficulty: "Easy",
  calories: 320,
  rating: 4.8,
  reviews: 124,
  description: "A restaurant-quality meal in 25 minutes. Plump shrimp bathed in a rich garlic parmesan cream sauce with spinach and sun-dried tomatoes.",
  tags: ["Keto", "Gluten-Free", "High Protein"],
  image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80",
  ingredients: [
    { name: "Large shrimp, peeled & deveined", amount: "1 lb" },
    { name: "Heavy cream", amount: "1 cup" },
    { name: "Sun-dried tomatoes", amount: "1/2 cup" },
    { name: "Baby spinach", amount: "2 cups" },
    { name: "Garlic, minced", amount: "4 cloves" },
    { name: "Parmesan cheese", amount: "1/2 cup" },
  ],
  steps: [
    "Season shrimp with salt and paprika. Sear in a large skillet over medium-high heat for 2 minutes per side. Remove and set aside.",
    "In the same pan, sauté garlic and sun-dried tomatoes until fragrant (about 1 minute).",
    "Reduce heat to low. Pour in heavy cream and bring to a gentle simmer. Stir in parmesan until melted.",
    "Add spinach and cook until wilted. Return shrimp to the pan and toss to coat.",
    "Serve immediately over zucchini noodles or pasta."
  ]
};

const MOCK_FORKS = [
  { id: 1, user: "Chef Mario", avatar: "https://i.pravatar.cc/150?u=mario", title: "Spicier Version", note: "Added red pepper flakes and cajun seasoning for a kick.", likes: 42, date: "2 days ago" },
  { id: 2, user: "Sarah Keto", avatar: "https://i.pravatar.cc/150?u=sarah", title: "Dairy-Free Mod", note: "Subbed coconut cream for heavy cream. Works perfectly!", likes: 18, date: "1 week ago" },
];

const MOCK_REVIEWS = [
  { id: 1, user: "FoodieFan99", avatar: "https://i.pravatar.cc/150?u=foodie", rating: 5, text: "Absolutely delicious! The sauce is to die for.", date: "Yesterday" },
  { id: 2, user: "BusyMom", avatar: "https://i.pravatar.cc/150?u=mom", rating: 4, text: "Quick and easy, but I used less salt.", date: "3 days ago" },
];

// --- COMPONENTS ---

const ActionButton = ({ icon: Icon, label, active }: { icon: any, label?: string, active?: boolean }) => (
  <button className={cn(
    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
    active 
      ? "bg-coral-50 text-coral-600 ring-1 ring-coral-200" 
      : "bg-white text-primary-600 hover:bg-primary-50 ring-1 ring-primary-100 shadow-sm"
  )}>
    <Icon className={cn("w-4 h-4", active && "fill-current")} />
    {label}
  </button>
);

const IngredientRow = ({ item }: { item: { name: string, amount: string } }) => {
  const [checked, setChecked] = useState(false);
  return (
    <div 
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors group",
        checked ? "bg-primary-50" : "hover:bg-cream-50"
      )}
      onClick={() => setChecked(!checked)}
    >
      <div className={cn(
        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
        checked ? "bg-coral-500 border-coral-500" : "border-primary-200 group-hover:border-coral-400"
      )}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className={cn("flex-1 text-sm font-medium", checked && "text-primary-400 line-through")}>
        <span className="font-bold text-primary-900">{item.amount}</span> {item.name}
      </div>
    </div>
  );
};

// --- REDESIGN PROPOSAL ---
function RecipeDetailRedesign() {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = [
    { id: 'Overview', icon: Utensils, label: 'Overview' },
    { id: 'Forks', icon: GitFork, label: `Forks (${MOCK_FORKS.length})` },
    { id: 'Reviews', icon: MessageSquare, label: `Reviews (${RECIPE.reviews})` },
    { id: 'Notes', icon: FilePen, label: 'My Notes' },
  ];

  return (
    <div className="bg-cream-50 min-h-screen font-sans text-primary-900 pb-20">
      
      {/* 1. HERO SECTION (Immersive) */}
      <div className="bg-white pb-0 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
          
          {/* Breadcrumb / Top Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-sm text-primary-500 font-medium">
              <span>Recipes</span>
              <span className="text-primary-300">/</span>
              <span>Dinner</span>
              <span className="text-primary-300">/</span>
              <span className="text-primary-900">Seafood</span>
            </div>
            <div className="flex gap-2">
               <ActionButton icon={Share2} label="Share" />
               <ActionButton icon={Printer} label="Print" />
               <ActionButton icon={MoreHorizontal} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-8">
            {/* Left: Content Info */}
            <div className="lg:col-span-7 space-y-6">
               <div className="space-y-4">
                  <div className="flex gap-2">
                     {RECIPE.tags.map(tag => (
                       <span key={tag} className="px-2.5 py-1 bg-coral-50 text-coral-700 text-xs font-bold uppercase tracking-wider rounded-md">
                         {tag}
                       </span>
                     ))}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-900 leading-tight">
                    {RECIPE.title}
                  </h1>
                  <p className="text-lg text-primary-600 leading-relaxed max-w-2xl">
                    {RECIPE.description}
                  </p>
               </div>

               {/* Author & Rating */}
               <div className="flex items-center gap-6 border-y border-primary-50 py-4">
                  <div className="flex items-center gap-3">
                     <img src={RECIPE.authorAvatar} alt="Author" className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm" />
                     <div>
                        <p className="text-sm font-bold text-primary-900">By {RECIPE.author}</p>
                        <p className="text-xs text-primary-500">Updated 2 days ago</p>
                     </div>
                  </div>
                  <div className="h-8 w-px bg-primary-100"></div>
                  <div className="flex items-center gap-1.5">
                     <div className="flex gap-0.5 text-yellow-400">
                        {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                     </div>
                     <span className="font-bold text-primary-900">{RECIPE.rating}</span>
                     <span className="text-sm text-primary-500 underline decoration-primary-200 cursor-pointer">
                        ({RECIPE.reviews} reviews)
                     </span>
                  </div>
               </div>

               {/* Action Bar (Save, Cook, etc) */}
               <div className="flex flex-wrap gap-3">
                  <button className="flex-1 bg-primary-900 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-primary-900/20 hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2">
                     <Play className="w-5 h-5 fill-current" /> Start Cook Mode
                  </button>
                  <button className="px-6 py-3.5 rounded-xl font-bold border border-primary-200 hover:bg-primary-50 text-primary-700 flex items-center gap-2">
                     <Heart className="w-5 h-5" /> Save
                  </button>
                  <button className="px-6 py-3.5 rounded-xl font-bold border border-primary-200 hover:bg-primary-50 text-primary-700 flex items-center gap-2">
                     <Zap className="w-5 h-5" /> Fork Recipe
                  </button>
               </div>
            </div>

            {/* Right: Hero Image */}
            <div className="lg:col-span-5 relative">
               <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl relative">
                  <img src={RECIPE.image} alt={RECIPE.title} className="w-full h-full object-cover" />
                  
                  {/* Floating Stats Card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/20 flex justify-between items-center">
                     <div className="text-center flex-1 border-r border-primary-100">
                        <div className="flex items-center justify-center gap-1 text-primary-500 mb-0.5">
                           <Clock className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-primary-900">{RECIPE.time}</p>
                        <p className="text-[10px] uppercase font-bold text-primary-400">Total</p>
                     </div>
                     <div className="text-center flex-1 border-r border-primary-100">
                        <div className="flex items-center justify-center gap-1 text-primary-500 mb-0.5">
                           <Users className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-primary-900">{RECIPE.servings}</p>
                        <p className="text-[10px] uppercase font-bold text-primary-400">Servings</p>
                     </div>
                     <div className="text-center flex-1">
                        <div className="flex items-center justify-center gap-1 text-primary-500 mb-0.5">
                           <Flame className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-primary-900">{RECIPE.calories}</p>
                        <p className="text-[10px] uppercase font-bold text-primary-400">Cals</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex gap-8 border-t border-primary-100 mt-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors",
                  activeTab === tab.id 
                    ? "border-coral-500 text-coral-600" 
                    : "border-transparent text-primary-500 hover:text-primary-800 hover:border-primary-200"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* OVERVIEW TAB (Combined Ingredients + Instructions) */}
        {activeTab === 'Overview' && (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* LEFT: Ingredients & Nutrition */}
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="font-display font-bold text-xl text-primary-900">Ingredients</h3>
                     <div className="flex items-center gap-2 bg-primary-50 p-1 rounded-lg">
                        <button className="p-1 hover:bg-white rounded shadow-sm transition-all"><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-bold w-4 text-center">4</span>
                        <button className="p-1 hover:bg-white rounded shadow-sm transition-all"><Plus className="w-3 h-3" /></button>
                     </div>
                  </div>
                  <div className="space-y-1">
                     {RECIPE.ingredients.map((ing, i) => (
                        <IngredientRow key={i} item={ing} />
                     ))}
                  </div>
                  <button className="w-full mt-6 flex items-center justify-center gap-2 py-3 border border-primary-200 rounded-xl font-bold text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                     <ShoppingCart className="w-4 h-4" /> Add to Shopping List
                  </button>
               </div>

               {/* Nutrition Card */}
               <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100">
                  <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
                     <ShieldCheck className="w-5 h-5 text-green-500" /> Nutrition
                  </h3>
                  <div className="space-y-3 text-sm">
                     <div className="flex justify-between pb-2 border-b border-primary-50">
                        <span className="text-primary-600">Calories</span>
                        <span className="font-bold text-primary-900">{RECIPE.calories}</span>
                     </div>
                     <div className="flex justify-between pb-2 border-b border-primary-50">
                        <span className="text-primary-600">Protein</span>
                        <span className="font-bold text-primary-900">28g</span>
                     </div>
                     <div className="flex justify-between pb-2 border-b border-primary-50">
                        <span className="text-primary-600">Carbs</span>
                        <span className="font-bold text-primary-900">12g</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-primary-600">Fat</span>
                        <span className="font-bold text-primary-900">18g</span>
                     </div>
                  </div>
                  <p className="text-xs text-primary-400 mt-4 text-center">Estimated values per serving</p>
               </div>
            </div>

            {/* CENTER: Instructions */}
            <div className="lg:col-span-8 space-y-8">
               <div className="bg-white rounded-2xl p-8 shadow-sm border border-primary-100">
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="font-display font-bold text-2xl text-primary-900">Instructions</h2>
                     <button className="text-sm font-bold text-coral-600 flex items-center gap-1 hover:underline">
                        <Zap className="w-4 h-4" /> AI: Simplify Steps
                     </button>
                  </div>

                  <div className="space-y-8">
                     {RECIPE.steps.map((step, i) => (
                        <div key={i} className="flex gap-6 group">
                           <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center border border-primary-200 group-hover:bg-primary-900 group-hover:text-white transition-colors">
                              {i + 1}
                           </div>
                           <div className="pt-2">
                              <p className="text-lg text-primary-800 leading-relaxed group-hover:text-primary-900 transition-colors">
                                 {step}
                              </p>
                              {i === 2 && (
                                 <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-amber-800 text-sm">
                                    <ChefHat className="w-5 h-5 flex-shrink-0" />
                                    <p><span className="font-bold">Pro Tip:</span> If the sauce gets too thick, add a splash of pasta water to loosen it up.</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Notes & Community */}
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100 h-full">
                     <h3 className="font-bold text-lg mb-4">Chef's Notes</h3>
                     <p className="text-primary-600 leading-relaxed">
                        For a dairy-free version, substitute the heavy cream with coconut milk and use nutritional yeast instead of parmesan.
                     </p>
                  </div>
                  <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-6 shadow-lg text-white h-full relative overflow-hidden">
                     <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-2">Made this?</h3>
                        <p className="text-white/80 text-sm mb-4">Share a photo and let us know how it turned out!</p>
                        <button className="w-full bg-white text-primary-900 py-3 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors">
                           Upload Photo
                        </button>
                     </div>
                     <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  </div>
               </div>
            </div>
         </div>
        )}

        {/* FORKS TAB */}
        {activeTab === 'Forks' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100 text-center py-12">
               <GitFork className="w-12 h-12 text-primary-300 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-primary-900">Recipe Lineage</h3>
               <p className="text-primary-500 mb-6">See how this recipe has evolved across the community.</p>
               <button className="px-6 py-2 bg-primary-50 text-primary-700 font-bold rounded-lg hover:bg-primary-100 transition-colors">
                 View Genealogy Tree
               </button>
             </div>

             <div className="grid gap-4">
               {MOCK_FORKS.map(fork => (
                 <div key={fork.id} className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100 flex items-start gap-4 hover:border-coral-200 transition-colors cursor-pointer">
                    <img src={fork.avatar} alt={fork.user} className="w-12 h-12 rounded-full ring-2 ring-primary-50" />
                    <div className="flex-1">
                       <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-primary-900">{fork.title}</h4>
                            <p className="text-sm text-primary-500">by {fork.user} • {fork.date}</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-bold text-coral-600 bg-coral-50 px-2 py-1 rounded-lg">
                             <Heart className="w-4 h-4" /> {fork.likes}
                          </div>
                       </div>
                       <div className="mt-3 p-3 bg-primary-50 rounded-xl text-primary-700 text-sm">
                          <span className="font-bold">Fork Note:</span> "{fork.note}"
                       </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-primary-300" />
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'Reviews' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100 flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-bold text-primary-900">4.8 <span className="text-lg text-primary-400 font-normal">/ 5</span></h3>
                   <div className="flex gap-1 text-yellow-400 my-1">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                   </div>
                   <p className="text-sm text-primary-500">Based on 124 reviews</p>
                </div>
                <button className="bg-primary-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-primary-800 transition-colors">
                   Write a Review
                </button>
             </div>

             <div className="space-y-6">
                {MOCK_REVIEWS.map(review => (
                   <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <img src={review.avatar} alt={review.user} className="w-10 h-10 rounded-full bg-primary-100" />
                            <div>
                               <p className="font-bold text-primary-900">{review.user}</p>
                               <p className="text-xs text-primary-400">{review.date}</p>
                            </div>
                         </div>
                         <div className="flex gap-0.5 text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                               <Star key={i} className={cn("w-4 h-4", i < review.rating ? "fill-current" : "text-primary-200")} />
                            ))}
                         </div>
                      </div>
                      <p className="text-primary-700 leading-relaxed">{review.text}</p>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'Notes' && (
           <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-100 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <FilePen className="w-32 h-32 text-yellow-600" />
                 </div>
                 <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2 relative z-10">
                    <FilePen className="w-6 h-6" /> Personal Chef Notes
                 </h3>
                 <textarea 
                    className="w-full bg-white/50 border-yellow-200 rounded-xl p-4 text-yellow-900 placeholder:text-yellow-900/40 focus:ring-2 focus:ring-yellow-400 focus:border-transparent min-h-[200px] relative z-10"
                    placeholder="Add your own notes, tweaks, and reminders for next time..."
                    defaultValue="Remember to thaw the shrimp 30 mins before starting. The sauce goes great with angel hair pasta too."
                 ></textarea>
                 <div className="flex justify-end mt-4 relative z-10">
                    <button className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-700 transition-colors">
                       Save Notes
                    </button>
                 </div>
              </div>
           </div>
        )}

      </div>

    </div>
  );
}

export function RecipeDetailShowcasePage() {
  return (
    <div>
      {/* Banner explaining the design */}
      <div className="bg-primary-900 text-white py-4 px-6 text-center">
        <p className="text-sm font-medium opacity-90">
          DESIGN PROPOSAL: Recipe Detail Page Redesign • <span className="text-coral-400 font-bold">Concept</span>
        </p>
      </div>
      <RecipeDetailRedesign />
    </div>
  );
}