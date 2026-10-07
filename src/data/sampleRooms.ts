import { RoomAnalysisResult, SampleRoom } from '../types';

export const SAMPLE_ROOMS: SampleRoom[] = [
  {
    id: 'home-office-desk',
    title: 'Work Desk & Cable Tangle',
    roomType: 'Home Office',
    description: 'A cluttered desk with overlapping papers, tech accessories, coffee cups, and tangled power cords.',
    imageUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=1200&q=80',
    clutterPreviewScore: 78,
    tag: 'High Friction',
  },
  {
    id: 'living-room-chaos',
    title: 'Living Room & Coffee Table',
    roomType: 'Living Room',
    description: 'Living room with scattered remotes, overflowing mail, toys on the rug, and cluttered bookshelves.',
    imageUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
    clutterPreviewScore: 65,
    tag: 'Surface Clutter',
  },
  {
    id: 'walk-in-closet',
    title: 'Overflowing Wardrobe & Closet',
    roomType: 'Closet / Wardrobe',
    description: 'Clothes piled on shelves, mixed hanger styles, shoes without racks, and disorganized accessories.',
    imageUrl: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=1200&q=80',
    clutterPreviewScore: 84,
    tag: 'High Density',
  },
  {
    id: 'kitchen-counter',
    title: 'Disorganized Kitchen Counter',
    roomType: 'Kitchen',
    description: 'Small appliances crowding prep surfaces, loose spice jars, cutting boards, and recipe papers.',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    clutterPreviewScore: 59,
    tag: 'Prep Obstacle',
  },
];

// Rich fallback pre-computed analysis for instant instant demo preview
export const DEMO_ANALYSIS_PRESETS: Record<string, RoomAnalysisResult> = {
  'home-office-desk': {
    roomType: 'Home Office / Workstation',
    roomSummary: 'A high-friction desk surface crowded with overlapping paperwork, peripheral cables, loose pens, and multiple beverage containers. Visual clutter is competing for focus directly in your primary visual field.',
    clutterScore: 78,
    calmnessRating: 'High Mental Friction',
    estimatedTimeMinutes: 35,
    hotspots: [
      {
        id: 'hs-1',
        name: 'Desk Surface Center Zone',
        severity: 'critical',
        description: 'Loose stationery, random sticky notes, and loose receipts obstructing the keyboard reach area.',
        primaryItems: ['Paper stacks', 'Sticky notes', 'Multiple pens', 'Mug collection'],
        quickFix: 'Sweep all papers into a single holding tray and return dirty mugs to the kitchen sink immediately.',
        approxLocation: 'Center desk workspace',
        coordinates: { x: 50, y: 65 },
      },
      {
        id: 'hs-2',
        name: 'Floor & Under-Desk Cable Nest',
        severity: 'high',
        description: 'Tangled power bricks, monitor cables, and charging leads creating a physical and visual hazard.',
        primaryItems: ['Power strip', 'USB chargers', 'Laptop power brick', 'Excess cable loops'],
        quickFix: 'Bundle long cables using velcro ties and tuck the power strip into an under-desk cable management tray.',
        approxLocation: 'Lower floor quadrant behind chair',
        coordinates: { x: 35, y: 88 },
      },
      {
        id: 'hs-3',
        name: 'Peripheral Shelving Overload',
        severity: 'medium',
        description: 'Reference books stacked horizontally, empty cardboard packaging, and duplicate tech gadgets.',
        primaryItems: ['Old gadget boxes', 'Horizontal book towers', 'Dusty cables'],
        quickFix: 'Recycle empty gadget boxes and shelve all books vertically with spines aligned to the front edge.',
        approxLocation: 'Left perimeter shelf',
        coordinates: { x: 20, y: 35 },
      },
    ],
    declutterPhases: [
      {
        phaseNumber: 1,
        phaseTitle: 'Surface Clearing Blitz',
        goal: 'Reclaim 80% of open desk real estate in 10 minutes',
        tasks: [
          {
            id: 't-1',
            action: 'Clear all dishes, drinkware, and trash into kitchen/bin',
            tips: 'Take a trash bag and recycling tote directly to the desk.',
            estimatedMinutes: 3,
          },
          {
            id: 't-2',
            action: 'Corral all loose writing tools into a single pencil cup or drawer insert',
            tips: 'Test pens on scrap paper; discard any dried-out ink pens immediately.',
            estimatedMinutes: 4,
          },
          {
            id: 't-3',
            action: 'Consolidate loose paper into two piles: Action Required vs Reference/File',
            tips: 'Do not read every document now; simply separate actionable items.',
            estimatedMinutes: 5,
          },
        ],
      },
      {
        phaseNumber: 2,
        phaseTitle: 'Categorize & Triage Tech',
        goal: 'Eliminate obsolete cords and duplicate peripherals',
        tasks: [
          {
            id: 't-4',
            action: 'Sort tech cables by connector type (USB-C, Lightning, HDMI)',
            tips: 'Keep max 2 spares per connector type; recycle old micro-USB or damaged cables.',
            estimatedMinutes: 8,
          },
          {
            id: 't-5',
            action: 'Mount power strip to underside of desktop with mounting tape or cable tray',
            tips: 'Keep primary power bricks off the carpet to reduce dust accumulation.',
            estimatedMinutes: 10,
          },
        ],
      },
      {
        phaseNumber: 3,
        phaseTitle: 'Zoning & Daily Reset Habit',
        goal: 'Establish clear ergonomic zones for focus',
        tasks: [
          {
            id: 't-6',
            action: 'Establish the "Golden Triangle": Monitor, Keyboard, and Clear Notepad Zone',
            tips: 'Only items used daily deserve permanent real estate on the desk.',
            estimatedMinutes: 5,
          },
        ],
      },
    ],
    triageMatrix: {
      keep: ['Daily primary laptop & monitor', '1 favorite notebook & fine pen', 'Active project folder', 'Ergonomic mouse'],
      donateOrSell: ['Duplicate mechanical keyboard', 'Extra unopened notebook sets', 'Spare monitor riser'],
      recycleOrTrash: ['Dead batteries & frayed cables', 'Outdated receipts (>1 yr old)', 'Empty tech retail boxes', 'Dry highlighter markers'],
      relocate: ['Kitchen mugs & snack plates', 'Personal mail belonging to entryway', 'Books not actively being studied'],
    },
    recommendedStorageSolutions: [
      {
        category: 'Cable Management',
        recommendation: 'Under-desk wire mesh raceway tray & velcro cord organizers',
        whyItHelps: 'Keeps cords 100% invisible and off the floor, eliminating visual static.',
        budgetFriendlyDiyAlt: 'Zip-tie cables together and mount with adhesive binder clips under desk rim.',
      },
      {
        category: 'Paper Containment',
        recommendation: 'Stackable bamboo paper inbox trays (Inbox, To File, Shred)',
        whyItHelps: 'Prevents flat horizontal sprawling of invoices and notes.',
        budgetFriendlyDiyAlt: 'Upcycled sturdy shoe box lid wrapped in kraft paper.',
      },
      {
        category: 'Drawer Organization',
        recommendation: 'Modular interlocking acrylic drawer dividers',
        whyItHelps: 'Gives paperclips, USB drives, and pens a designated slot so they never drift.',
        budgetFriendlyDiyAlt: 'Repurposed clean tea tin boxes or smartphone gift boxes.',
      },
    ],
    dailyMaintenanceHabit: 'The "5:00 PM Shutdown Reset": 60 seconds before leaving your desk, return dirty cups to the sink, put pens in the cup, and align your keyboard flat against the monitor.',
    motivationalSummary: 'Your desk is the launchpad for your creative mind. Clearing this physical clutter will instantly free up mental bandwidth for your highest-priority goals.',
  },
};
