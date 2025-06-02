<script setup>
import { ref, computed, reactive } from 'vue'
import ExpCalculator from './components/ExpCalculator.vue'
</script>

<template>
  <div class="wrapper">
    <header>
      <h1>Limbus Company Identity EXP Calculator</h1>
    </header>
    <main>
      <ExpCalculator />
    </main>
    <footer>
      <p>© 2025 | Made by Qkinawa</p>
    </footer>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

body {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.wrapper {
  width: 100%;
  height: 100vh;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

header {
  text-align: center;
  padding: 8px 0;
  background-color: #2c3e50;
  color: white;
  flex-shrink: 0;
  width: 100%;
}

header h1 {
  font-size: 1.3rem;
  margin: 0;
}

main {
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  flex: 1;
  overflow: hidden;
  width: 100%;
  display: flex;
  justify-content: center;
}

footer {
  text-align: center;
  font-size: 0.7rem;
  color: #666;
  padding: 4px 0;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
}
</style>
