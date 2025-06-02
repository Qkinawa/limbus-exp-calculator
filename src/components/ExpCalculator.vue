<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { parseCSV } from '../utils/csvParser.js'

const EXP_TICKET_VALUES = {
  small: 50,
  medium: 200,
  large: 1000,
  huge: 3000
}

const CANTO_CAPS = [
  { canto: 1, levelCap: 40, luxUnlocked: 1 },
  { canto: 2, levelCap: 40, luxUnlocked: 2 },
  { canto: 3, levelCap: 45, luxUnlocked: 3 },
  { canto: 4, levelCap: 45, luxUnlocked: 4 },
  { canto: 5, levelCap: 50, luxUnlocked: 5 },
  { canto: 6, levelCap: 50, luxUnlocked: 6 },
  { canto: 7, levelCap: 55, luxUnlocked: 7 },
  { canto: 8, levelCap: 55, luxUnlocked: 8 }
]

const expData = ref([]);
const modulesData = ref([]);

onMounted(async () => {
  try {
    const expResponse = await fetch('/src/assets/exp.csv');
    const expCsvText = await expResponse.text();
    expData.value = parseCSV(expCsvText);
    console.log('EXP data loaded:', expData.value);

    const modulesResponse = await fetch('/src/assets/modules.csv');
    const modulesCsvText = await modulesResponse.text();
    modulesData.value = parseCSV(modulesCsvText);
    console.log('Modules data loaded:', modulesData.value);
  } catch (error) {
    console.error('Error loading data:', error);
  }
});

const EXP_TABLE = {
  expForLevel(level) {
    if (expData.value.length > 0) {
      const levelData = expData.value.find(entry => entry.Level === level);
      return levelData ? levelData.Exp : 0;
    }
    return 0
  },

  totalExpToLevel(level) {
    if (expData.value.length > 0) {
      const levelData = expData.value.find(entry => entry.Level === level);
      return levelData ? levelData['Total Exp'] : 0;
    }
    return 0;
  },

  expToNextLevel(currentLevel, currentExp) {
    const totalExpCurrent = this.totalExpToLevel(currentLevel) + currentExp;
    const totalExpNext = this.totalExpToLevel(currentLevel + 1);
    return totalExpNext - totalExpCurrent;
  }
}

const luxcavationDataFromCSV = computed(() => {
  if (modulesData.value.length > 0) {
    return modulesData.value.map(entry => ({
      level: entry.Luxcavation,
      stage: getLuxStage(entry.Luxcavation),
      moduleCost: entry['Module Cost'],
      clearExp: entry['Clear Exp'],
      xpPerModule: entry['XP per Module'],
      stageUnlock: entry['Stage unlock']
    }));
  }
  return [];
});

function getLuxStage(level) {
  return `Stage ${level}`;
}

const LUXCAVATION_INFO = computed(() => {
  if (luxcavationDataFromCSV.value.length > 0) {
    return luxcavationDataFromCSV.value;
  }

  return [
    { level: 1, stage: "Stage 1", moduleCost: 2, clearExp: 1700, xpPerModule: 850 },
    { level: 2, stage: "Stage 2", moduleCost: 2, clearExp: 3600, xpPerModule: 1800 },
    { level: 3, stage: "Stage 3", moduleCost: 2, clearExp: 4800, xpPerModule: 2400 },
    { level: 4, stage: "Stage 4", moduleCost: 3, clearExp: 10000, xpPerModule: 3333.3 },
    { level: 5, stage: "Stage 5", moduleCost: 3, clearExp: 12200, xpPerModule: 4066.7 },
    { level: 6, stage: "Stage 6", moduleCost: 3, clearExp: 14400, xpPerModule: 4800 },
    { level: 7, stage: "Stage 7", moduleCost: 3, clearExp: 16800, xpPerModule: 5600 },
    { level: 8, stage: "Stage 8", moduleCost: 3, clearExp: 20800, xpPerModule: 6933.3 }
  ];
});

const form = reactive({
  currentLevel: 1,
  currentExp: 0,
  targetLevel: 40,
  cantoProgress: 1,
  tickets: {
    small: 0,
    medium: 0,
    large: 0,
    huge: 0
  }
})

const currentLevelCap = computed(() => {
  const cantoInfo = CANTO_CAPS.find(cap => cap.canto === currentCanto.value) || CANTO_CAPS[0]
  return cantoInfo.levelCap
})

const availableLuxcavations = computed(() => {
  const cantoInfo = CANTO_CAPS.find(cap => cap.canto === currentCanto.value) || CANTO_CAPS[0]
  return LUXCAVATION_INFO.value.slice(0, cantoInfo.luxUnlocked)
})

const totalCurrentExp = computed(() => {
  return EXP_TABLE.totalExpToLevel(form.currentLevel) + form.currentExp
})

const totalTargetExp = computed(() => {
  return EXP_TABLE.totalExpToLevel(form.targetLevel)
})

const expNeeded = computed(() => {
  return totalTargetExp.value - totalCurrentExp.value
})

const ticketsExp = computed(() => {
  return form.tickets.small * EXP_TICKET_VALUES.small +
         form.tickets.medium * EXP_TICKET_VALUES.medium +
         form.tickets.large * EXP_TICKET_VALUES.large +
         form.tickets.huge * EXP_TICKET_VALUES.huge
})

const expAfterTickets = computed(() => {
  return Math.max(0, expNeeded.value - ticketsExp.value)
})

const luxcavationRuns = computed(() => {
  return availableLuxcavations.value.map(lux => {
    const runsNeeded = Math.ceil(expAfterTickets.value / lux.clearExp)
    const totalModules = runsNeeded * lux.moduleCost

    return {
      ...lux,
      runsNeeded,
      totalModules
    }
  })
})

const updateMaxLevel = () => {
  const cap = currentLevelCap.value
  if (form.targetLevel > cap) {
    form.targetLevel = cap
  }
}

const updateCantoBasedOnLevel = () => {
  const appropriateCanto = CANTO_CAPS.find(cap => cap.levelCap >= form.targetLevel)

  if (appropriateCanto) {
    form.cantoProgress = appropriateCanto.canto
  }
}

const increment = (property, max = Infinity, step = 1) => {
  if (typeof property === 'string') {
    const [parent, child] = property.split('.')
    if (form[parent][child] < max) {
      form[parent][child] += step
    }
  } else if (property < max) {
    property += step
  }
}

const decrement = (property, min = 0, step = 1) => {
  if (typeof property === 'string') {
    const [parent, child] = property.split('.')
    if (form[parent][child] > min) {
      form[parent][child] -= step
    }
  } else if (property > min) {
    property -= step
  }
}

const incrementCurrentLevel = () => {
  if (form.currentLevel < 55 && form.currentLevel < form.targetLevel) {
    form.currentLevel++
    validateCurrentLevel()
  }
}

const validateCurrentLevel = () => {
  if (form.currentLevel > form.targetLevel) {
    form.currentLevel = form.targetLevel
  }
}

const maxCurrentLevelExp = computed(() => {
  if (expData.value.length > 0) {
    const levelData = expData.value.find(entry => parseInt(entry.Level) === form.currentLevel + 1);
    return levelData ? parseInt(levelData.Exp) : 0;
  }
  return 0;
});

const decrementCurrentLevel = () => {
  if (form.currentLevel > 1) {
    form.currentLevel--
  }
}

const incrementCurrentExp = () => {
  form.currentExp += 50
}

const decrementCurrentExp = () => {
  if (form.currentExp >= 50) {
    form.currentExp -= 50
  } else {
    form.currentExp = 0
  }
}

const incrementTargetLevel = () => {
  if (form.targetLevel < currentLevelCap.value) {
    form.targetLevel++
  }
}

const decrementTargetLevel = () => {
  if (form.targetLevel > form.currentLevel) {
    form.targetLevel--
  }
}

const incrementTicket = (type) => {
  form.tickets[type]++
}

const decrementTicket = (type) => {
  if (form.tickets[type] > 0) {
    form.tickets[type]--
  }
}

const requiredTickets = computed(() => {
  try {
    let remainingExp = Math.max(0, expNeeded.value);
    const tickets = { huge: 0, large: 0, medium: 0, small: 0 };

    tickets.huge = Math.floor(remainingExp / EXP_TICKET_VALUES.huge);
    remainingExp -= tickets.huge * EXP_TICKET_VALUES.huge;

    tickets.large = Math.floor(remainingExp / EXP_TICKET_VALUES.large);
    remainingExp -= tickets.large * EXP_TICKET_VALUES.large;

    tickets.medium = Math.floor(remainingExp / EXP_TICKET_VALUES.medium);
    remainingExp -= tickets.medium * EXP_TICKET_VALUES.medium;

    tickets.small = Math.ceil(remainingExp / EXP_TICKET_VALUES.small);

    return tickets;
  } catch (e) {
    console.error("Ошибка расчета билетов:", e);
    return { huge: 0, large: 0, medium: 0, small: 0 };
  }
});

const currentCanto = computed(() => {
  const cantoInfo = [...CANTO_CAPS]
      .sort((a, b) => b.canto - a.canto)
      .find(cap => form.currentLevel <= cap.levelCap)

  return cantoInfo ? cantoInfo.canto : 1
})

const handleCantoChange = () => {
  updateMaxLevel()
  const cantoInfo = CANTO_CAPS.find(cap => cap.canto === form.cantoProgress)
  if (cantoInfo) {
    form.targetLevel = cantoInfo.levelCap
  }
}
</script>

<template>
  <div class="calculator-container">
    <div class="calculator-grid">
      <div class="character-info panel">
        <h2>ID Info</h2>
        <div class="form-group">
          <label>Current level:</label>
          <div class="input-with-buttons">
            <button class="btn-minus" @click="decrementCurrentLevel">-</button>
            <input type="number" v-model.number="form.currentLevel" min="1" :max="form.targetLevel" @change="validateCurrentLevel" />
            <button class="btn-plus" @click="incrementCurrentLevel">+</button>
          </div>
        </div>
        <div class="form-group">
          <label>Current EXP:</label>
          <div class="input-with-buttons">
            <button class="btn-minus" @click="decrementCurrentExp()">-</button>
            <input type="number" v-model.number="form.currentExp" min="0" />
            <button class="btn-plus" @click="incrementCurrentExp()">+</button>
          </div>
        </div>
        <div class="form-group">
          <label>Target level:</label>
          <div class="input-with-buttons">
            <button class="btn-minus" @click="decrementTargetLevel">-</button>
            <input type="number" v-model.number="form.targetLevel" min="1" :max="currentLevelCap" />
            <button class="btn-plus" @click="incrementTargetLevel">+</button>
          </div>
        </div>
        <br>
        <h2>EXP Tickets</h2>
        <div class="form-group">
          <label>Identity Training Ticket I (50):</label>
          <div class="input-with-buttons">
            <button class="btn-minus" @click="decrementTicket('small')">-</button>
            <input type="number" v-model.number="form.tickets.small" min="0" />
            <button class="btn-plus" @click="incrementTicket('small')">+</button>
          </div>
        </div>
        <div class="form-group">
          <label>Identity Training Ticket II (200):</label>
          <div class="input-with-buttons">
            <button class="btn-minus" @click="decrementTicket('medium')">-</button>
            <input type="number" v-model.number="form.tickets.medium" min="0" />
            <button class="btn-plus" @click="incrementTicket('medium')">+</button>
          </div>
        </div>
        <div class="form-group">
          <label>Identity Training Ticket III (1000):</label>
          <div class="input-with-buttons">
            <button class="btn-minus" @click="decrementTicket('large')">-</button>
            <input type="number" v-model.number="form.tickets.large" min="0" />
            <button class="btn-plus" @click="incrementTicket('large')">+</button>
          </div>
        </div>
        <div class="form-group">
          <label>Identity Training Ticket IV (3000):</label>
          <div class="input-with-buttons">
            <button class="btn-minus" @click="decrementTicket('huge')">-</button>
            <input type="number" v-model.number="form.tickets.huge" min="0" />
            <button class="btn-plus" @click="incrementTicket('huge')">+</button>
          </div>
        </div>
        <div class="ticket-total">
          <p>Total EXP from tickets: <strong>{{ ticketsExp }}</strong></p>
        </div>
      </div>

      <div class="luxcavation panel">
        <h2>Luxcavation Runs</h2>
        <div class="luxcavation-table">
          <div class="lux-header">
            <div>Stage</div>
            <div>Unlocks at</div>
            <div>EXP / Run</div>
            <div>Modules</div>
            <div>Runs</div>
            <div>Total Modules</div>
          </div>
          <div v-for="lux in luxcavationRuns" :key="lux.level" class="lux-row">
            <div>{{ lux.stage }}</div>
            <div>{{ lux.stageUnlock }}</div>
            <div>{{ lux.clearExp }}</div>
            <div>{{ lux.moduleCost }}</div>
            <div>{{ lux.runsNeeded }}</div>
            <div>{{ lux.totalModules }}</div>
          </div>
        </div>
      </div>

      <div class="results panel">
        <h2>Results</h2>
        <div class="result-item">
          <span>Current level:</span>
          <strong>{{ form.currentLevel }} ({{ form.currentExp.toString() }} EXP)</strong>
        </div>
        <div class="result-item">
          <span>EXP to next level:</span>
          <strong>{{ EXP_TABLE.expToNextLevel(form.currentLevel, form.currentExp) }}</strong>
        </div>
        <div class="result-item">
          <span>Target level:</span>
          <strong>{{ form.targetLevel }}</strong>
        </div>
        <div class="result-item">
          <span>EXP required:</span>
          <strong>{{ expNeeded }}</strong>
        </div>
        <div class="result-item">
          <span>After using tickets:</span>
          <strong>{{ expAfterTickets }}</strong>
        </div>

        <h3>Tickets required</h3>
        <div class="result-item">
          <span>Identity Training Ticket IV (3000):</span>
          <strong>{{ requiredTickets.huge }}</strong>
        </div>
        <div class="result-item">
          <span>Identity Training Ticket III (1000):</span>
          <strong>{{ requiredTickets.large }}</strong>
        </div>
        <div class="result-item">
          <span>Identity Training Ticket II (200):</span>
          <strong>{{ requiredTickets.medium }}</strong>
        </div>
        <div class="result-item">
          <span>Identity Training Ticket I (50):</span>
          <strong>{{ requiredTickets.small }}</strong>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>

.calculator-container {
  width: 85%;
  min-width: 800px;
  padding: 5px 8px;
  max-height: calc(100vh - 80px);
  overflow: auto;
  margin-left: 0;
}

.calculator-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 10px;
  grid-template-areas:
    "character results luxcavation";
  width: 100%;
  justify-content: start;
}

.character-info {
  grid-area: character;
}

.tickets-info {
  grid-area: tickets;
}

.results {
  grid-area: results;
}

.luxcavation {
  grid-area: luxcavation;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  overflow-y: auto;
}

.panel {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.panel h2 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1rem;
  color: #343a40;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 8px;
}

.form-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
  -webkit-appearance: none;
  -moz-appearance: textfield;
}

select {
  width: 220px;
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: left;
}
h3 {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #dee2e6;
  font-size: 0.95rem;
  color: #343a40;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-with-buttons {
  display: flex;
  align-items: center;
}

.btn-minus, .btn-plus {
  width: 25px;
  height: 25px;
  border: 1px solid #ced4da;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-weight: bold;
  user-select: none;
}

.btn-minus {
  border-radius: 4px 0 0 4px;
}

.btn-plus {
  border-radius: 0 4px 4px 0;
}

.btn-minus:hover, .btn-plus:hover {
  background-color: #e9ecef;
}

.btn-minus:active, .btn-plus:active {
  background-color: #dee2e6;
}

.result-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed #e9ecef;
}

.ticket-total {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #dee2e6;
  text-align: right;
}

.luxcavation-table {
  width: 100%;
  margin-top: 8px;
  font-size: 0.85rem;
  flex-grow: 1;
  overflow-y: auto;
  max-height: calc(100% - 40px);
}

.lux-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 0.7fr 0.7fr 1fr;
  background-color: #e9ecef;
  font-weight: bold;
  padding: 6px 4px;
  border-radius: 4px 4px 0 0;
}

.lux-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 0.7fr 0.7fr 1fr;
  padding: 6px 4px;
  border-bottom: 1px solid #e9ecef;
}

.lux-row:nth-child(odd) {
  background-color: #f8f9fa;
}

@media (max-width: 768px) {
  .calculator-grid {
    grid-template-columns: 1fr;
    grid-gap: 10px;
    grid-template-areas:
      "character"
      "luxcavation"
      "results";
  }

  .lux-header, .lux-row {
    font-size: 0.65rem;
    grid-template-columns: 1fr 0.8fr 0.8fr 0.6fr 0.6fr 0.8fr;
  }
}
</style>
