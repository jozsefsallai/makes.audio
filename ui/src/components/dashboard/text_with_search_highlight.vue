<template lang="pug">
  span.t-w-s-h
    span.before-q {{ before_q }}
    span.q-highlight {{ display_q }}
    span.after-q {{ after_q }}
</template>

<script lang="coffee">
  import Vue from 'vue'

  export default Vue.component 'text-with-search-highlight',
    props:
      text: (type: String, required: true)
      q: (type: String)
    computed:
      before_q: ->
        if @q and @q.length and @text.includes @q then @text.substr(0, @text.indexOf(@q)) else @text
      display_q: ->
        if @q and @q.length and @text.includes @q then @q else null
      after_q: ->
        if @q and @q.length and @text.includes @q then @text.substr(@text.indexOf(@q) + @q.length) else null
</script>

<style lang="scss">
  .q-highlight {
    background: yellow;
  }
</style>
