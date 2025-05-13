<script setup>
import logoAplication from '@/assets/logoAplication.png';
import cerrar from '@/assets/cerrar.svg';
import maximizar from '@/assets/maximizar.svg';
import minimizar from '@/assets/minimizar.svg';

</script>

<template>
  <div class="title-win">
    <img :src="logoAplication" alt="logo">
    <div class="title-win-text">
      <span>XilefMap</span>
    </div>
    <div class="title-button">
      <button class="buttonMaximize buttonWindow" onclick="maximizar()">
        <img :src="maximizar" alt="maximizar">
      </button>
      <button class="buttonMinimize buttonWindow" onclick="minimizar()">
        <img :src="minimizar" alt="minimizar">
      </button>
      <button class="buttonClose buttonWindow" onclick="window.close()">
        <img :src="cerrar"  alt="cerrar" />
      </button>
    </div>
  </div>
</template>

<style scoped>
  .title-win img{
    width: 5vh;
    height: 5vh;
    margin-block: 2vh;
  }
  .title-button img{
    width: 12px;
    height: 12px;
    margin: 0;
    padding: 0;
    filter: contrast(60%);

  }
  .title-button img:hover{
    cursor: pointer;
    transform: scale(1.2);
    filter: contrast(100%);
  }
  .title-button button{
    display: flex;
    justify-content: center;
    align-items: center;
    outline: none;
  }

</style>