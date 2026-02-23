// News templates by category
const templates = {
  Technology: [
    'Apple announces revolutionary {product} with {feature}',
    'Google launches new {product} that changes everything',
    'Tesla CEO reveals plans for {product} in 2025',
    'Microsoft acquires {company} for $50 billion',
    'New AI system {capability} better than humans',
    'Facebook rebrands to {name} and pivots to metaverse',
    'Amazon develops {product} that threatens {industry}',
    'Breakthrough in quantum computing: {achievement}',
    'Elon Musk announces {project} will launch next year',
    'New smartphone feature: {feature} confirmed for iPhone 20'
  ],
  Health: [
    'Scientists discover cure for {disease}',
    'New study shows {food} prevents cancer',
    'WHO warns about {disease} outbreak in {location}',
    'Breakthrough vaccine for {disease} approved',
    'Drinking {beverage} daily extends life by 10 years',
    'New research: {activity} causes {disease}',
    'Doctors discover {treatment} reverses aging',
    'FDA approves revolutionary {drug} for {condition}',
    'Study reveals {supplement} boosts immunity by 200%',
    'New virus strain {name} spreads rapidly in {location}'
  ],
  Politics: [
    '{politician} announces shocking resignation',
    'Government reveals {policy} will be implemented',
    'Election fraud allegations surface in {location}',
    '{country} threatens war over {issue}',
    'President {name} signs controversial {law}',
    'Leaked documents reveal {scandal}',
    '{politician} caught in {scandal}',
    'New law bans {thing} nationwide',
    '{country} and {country} form unexpected alliance',
    'Supreme Court overturns {law} in landmark decision'
  ],
  Science: [
    'NASA discovers {discovery} on Mars',
    'Scientists prove {theory} is actually true',
    'Asteroid {name} will pass Earth next week',
    'Breakthrough in fusion energy: {achievement}',
    'New species discovered: {species} found in {location}',
    'Climate study reveals {finding}',
    'Physicists confirm existence of {particle}',
    'Space telescope captures {discovery}',
    'Researchers solve mystery of {phenomenon}',
    'New element {name} added to periodic table'
  ],
  Business: [
    '{company} stock soars 500% after {news}',
    'Bitcoin reaches all-time high of ${price}',
    '{billionaire} becomes world\'s first trillionaire',
    '{company} files for bankruptcy',
    'Market crash predicted: experts warn {reason}',
    '{company} CEO steps down amid {scandal}',
    'New cryptocurrency {name} gains 1000% in 24 hours',
    'Economic recession confirmed by {source}',
    '{company} to lay off {number} employees',
    'Housing market collapse: prices drop {percent}%'
  ],
  Entertainment: [
    '{celebrity} announces surprise retirement',
    'New {movie} breaks box office records',
    '{celebrity} and {celebrity} secret relationship revealed',
    '{show} cancelled after {number} seasons',
    '{celebrity} wins {award} for {achievement}',
    'Shocking twist in {show} finale',
    '{celebrity} arrested for {reason}',
    '{band} announces reunion tour after {years} years',
    'New {franchise} movie confirmed for 2026',
    '{celebrity} dies at age {age}'
  ]
};

// Placeholders for dynamic content
const placeholders = {
  product: ['iPhone 20', 'Tesla Bot', 'VR headset', 'smart glasses', 'flying car'],
  feature: ['holographic display', 'mind control', 'infinite battery', 'teleportation'],
  company: ['TikTok', 'OpenAI', 'SpaceX', 'Nvidia', 'ARM'],
  capability: ['writes code', 'predicts future', 'reads minds', 'creates art'],
  name: ['MetaVerse Inc', 'Infinity Corp', 'NeuroLink', 'QuantumTech'],
  industry: ['taxi industry', 'retail', 'healthcare', 'education'],
  achievement: ['stable qubits achieved', '1000x faster processing', 'room temperature operation'],
  project: ['Mars colony', 'Hyperloop 2.0', 'Brain chip', 'Solar city'],
  disease: ['Alzheimer\'s', 'diabetes', 'cancer', 'COVID-25'],
  food: ['coffee', 'chocolate', 'red wine', 'avocado', 'blueberries'],
  location: ['Asia', 'Europe', 'Africa', 'South America'],
  beverage: ['green tea', 'lemon water', 'kombucha', 'beetroot juice'],
  activity: ['sitting', 'using phone', 'eating sugar', 'sleeping late'],
  treatment: ['gene therapy', 'stem cells', 'nanobots', 'light therapy'],
  drug: ['NeuroMax', 'GeneCure', 'ImmuBoost', 'LifeExtend'],
  condition: ['depression', 'arthritis', 'obesity', 'insomnia'],
  supplement: ['Vitamin D', 'Omega-3', 'Probiotics', 'CoQ10'],
  politician: ['President Johnson', 'Senator Williams', 'PM Anderson', 'Governor Smith'],
  policy: ['universal basic income', 'free healthcare', '4-day workweek'],
  country: ['China', 'Russia', 'USA', 'India', 'Brazil'],
  issue: ['territory dispute', 'trade agreement', 'cyber attack'],
  law: ['tech regulation', 'climate act', 'AI ethics bill'],
  scandal: ['corruption scandal', 'affair', 'tax evasion'],
  thing: ['social media', 'cryptocurrency', 'gas cars', 'plastic bags'],
  discovery: ['ancient ruins', 'water source', 'alien signals', 'new mineral'],
  theory: ['multiverse theory', 'time travel', 'parallel dimensions'],
  species: ['giant spider', 'transparent fish', 'glowing jellyfish'],
  phenomenon: ['Bermuda Triangle', 'dark matter', 'ball lightning'],
  particle: ['graviton', 'tachyon', 'dark photon'],
  news: ['breakthrough product', 'merger announcement', 'patent approval'],
  price: ['100,000', '250,000', '500,000', '1,000,000'],
  billionaire: ['Elon Musk', 'Jeff Bezos', 'Mark Zuckerberg'],
  reason: ['inflation fears', 'geopolitical tension', 'tech bubble'],
  number: ['10,000', '50,000', '100,000'],
  percent: ['30', '50', '70'],
  celebrity: ['Tom Cruise', 'Taylor Swift', 'Dwayne Johnson', 'Beyonce'],
  movie: ['Avatar 5', 'Marvel Phase 10', 'Star Wars Episode 15'],
  show: ['Stranger Things', 'The Crown', 'Game of Thrones'],
  award: ['Oscar', 'Grammy', 'Emmy', 'Golden Globe'],
  achievement: ['Best Actor', 'Album of the Year', 'Lifetime Achievement'],
  band: ['The Beatles', 'Led Zeppelin', 'Queen', 'Nirvana'],
  franchise: ['Harry Potter', 'Lord of the Rings', 'Jurassic Park'],
  age: ['45', '52', '67', '71'],
  years: ['10', '20', '30']
};

// Generate a claim from template
function generateClaim(category, template) {
  let claim = template;
  
  // Replace all placeholders
  const matches = claim.match(/\{(\w+)\}/g);
  if (matches) {
    matches.forEach(match => {
      const key = match.slice(1, -1); // Remove { }
      if (placeholders[key]) {
        const randomValue = placeholders[key][Math.floor(Math.random() * placeholders[key].length)];
        claim = claim.replace(match, randomValue);
      }
    });
  }
  
  return claim;
}

module.exports = {
  templates,
  generateClaim
};