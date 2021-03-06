<template lang="pug">
  li.dashboard-audio-list-item(:class='[{ open: open }, extension_class]')
    confirm-delete-popup(
      v-if='delete_modal_open'
      :audio_name='audio.name'
      @close='handle_delete_modal_cancel'
      @confirm='handle_delete_modal_confirm'
    )
    .top-section(@click='handle_click')
      .controls.pull-right
        a(href='javascript:;', title='Delete', @click='handle_delete_icon_click').icon-link
          span.fa.fa-trash
        a(:href='audio.downloadUrl', title='Download').icon-link
          span.fa.fa-download
        a(href='javascript:;', @click='handle_edit_clicked').icon-link
          span.fa.fa-times(v-if='edit_mode')
          span.fa.fa-pencil(v-else=true)
      .title(v-if='edit_mode')
        form.my-0.d-block(@submit='handle_edit_submit')
          input(
            type='submit'
            @click='handle_hidden_submit_click'
            hidden='true'
          )
          input.edit-url-input(
            v-model='edit_url_input_value'
            type='text'
            :disabled='loading'
            @click='handle_edit_url_input_click'
          )
          input.edit-description-input(
            v-model='edit_description_input_value'
            type='text'
            placeholder='Description'
            :disabled='loading'
            @click='handle_edit_description_input_click'
          )
      div(v-else=true)
        .title
          a.public-link(
            :title='public_link_title'
            :href='audio.publicUrl'
            target='_blank'
          )
            .basename
              text-with-search-highlight(:text='basename', :q='q')
            .extension(v-if='extension')
              text-with-search-highlight(:text='extension', :q='q')
            .no-extension(v-if='!extension') [no extension]
          span.fa.fa-eye-slash(v-if='!audio.visible')
        .description {{ display_description }}
      ul.meta
        li {{ uploaded_at }}
        li(v-if='is_audio') {{ length }}
        li.not-audio(v-else) [not an audio file]
        toggle-chevron(:open='open').pull-right
    .details-section
      audio-list-item-details(:audio='audio')
</template>

<script lang="coffee">
  import Vue from 'vue'
  import moment from 'moment'
  import one_of from 'lib/one_of'
  import errors from 'i18n/errors'
  import highlight from 'components/dashboard/text_with_search_highlight'
  import audio_list_item_details from './audio_list_item_details'
  import toggle_chevron from './toggle-chevron'
  import input_text from 'components/controls/input_text'
  import Toaster from 'lib/toaster'
  import DurationFormatter from 'lib/duration_formatter'
  import confirm_delete_popup from './confirm_delete_popup'

  export default {
    name: 'dashboard-audio-list-item'
    data: ->
      loading: false
      open: false
      edit_mode: false
      edit_url_input_value: ''
      edit_description_input_value: ''
      delete_modal_open: false
    components:
      'text-with-search-highlight': highlight
      'audio-list-item-details': audio_list_item_details
      'toggle-chevron': toggle_chevron
      'input-text': input_text
      'confirm-delete-popup': confirm_delete_popup
    props:
      audio: Object
      q: String
    computed:
      toggle_visibility_classes: ->
        'fa-eye': @audio.visible
        'fa-eye-slash': not @audio.visible
      public_link_title: -> "Open up #{@audio.url} in a new tab"
      uploaded_at: ->
        "Uploaded #{moment(@audio.createdAt).fromNow()}"
      display_description: ->
        @audio.description || 'no description'
      length: ->
        if @audio.duration
          DurationFormatter.format @audio.duration
        else
          'Processing...'
      is_audio: ->
        if @audio.mimetype.split('/')[0] == 'audio' then true else false
      basename: ->
        matches = @audio.url.match(/(.+)\.(.+)/)
        if matches then matches[1] else @audio.url
      extension: ->
        matches = @audio.url.match(/(.+)\.(.+)/)
        if matches then ".#{matches[2]}" else null
      extension_class: ->
        if @audio.url.split('.')[1]
          'extension-' + @audio.mimetype.split('/')[1]
        else null
    methods:
      handle_edit_clicked: (e) ->
        e.stopPropagation()
        @edit_url_input_value = @audio.url
        @edit_description_input_value = @audio.description || null
        @edit_mode = !@edit_mode
      handle_edit_url_input_click: (e) -> e.stopPropagation()
      handle_edit_description_input_click: (e) -> e.stopPropagation()
      handle_hidden_submit_click: (e) -> e.stopPropagation()
      handle_click: (e) ->
        @open = !@open
      handle_visible_changed: ->
        @save !visible: @audio.visible
      save: (body) ->
        @loading = true
        fetch @audio.updateUrl,
          method: 'PATCH'
          headers:
            'Accept': 'application/json'
            'Content-Type': 'application/json'
          credentials: 'same-origin'
          body: JSON.stringify body
        .then (data) -> data.json()
        .then (json) =>
          @loading = false
          if json.ok
            @edit_mode = false
            @$store.commit 'update_audio', json.audio
            message = "#{json.audio.url} has been updated."
            Toaster.create 'success', message, 'Great!'
          else if json.errors
            for error in json.errors
              Toaster.create 'danger', errors.create_upload[error.code]
          else
            Toaster.create 'danger', 'Something went wrong!'
      handle_edit_submit: (e) ->
        e.preventDefault()
        @save 
          url: @edit_url_input_value
          description: @edit_description_input_value
      handle_delete_icon_click: (e) ->
        e.stopPropagation()
        @delete_modal_open = true
      handle_delete_modal_cancel: ->
        @delete_modal_open = false
      handle_delete_modal_confirm: ->
        @delete_modal_open = false
        @loading = true
        fetch @audio.updateUrl,
          method: 'DELETE'
          headers:
            'Accept': 'application/json'
            'Content-Type': 'application/json'
          credentials: 'same-origin'
        .then (data) -> data.json()
        .then (json) =>
          @loading = false
          if json.ok
            @$store.commit 'delete_audio', @audio.id
            Toaster.create 'success', "#{@audio.url} has been deleted.", "R.I.P."
          else if json.errors
            for error in json.errors
              Toaster.create 'danger', errors.delete_upload[error.code]
          else
            Toaster.create 'danger', 'Something went wrong!'
  }
</script>

<style lang="scss">
  @import 'src/styles/colors';
  @import 'src/styles/mixins';
  @import 'src/styles/extensions';

  .dashboard-audio-list-item {
    .edit-url-input, .edit-description-input {
      display: inline-block;
      border: none;
      font-family: 'arconregular', sans-serif;
      outline: none;

      &:focus {
        border-bottom: 2px dashed $pink;
      }
    }
    .edit-description-input {
      display: block;
      width: 100%;
      font-style: italic;
      font-size: 16px;
      border-width: 1px;
      margin-top: 5px;
      margin-bottom: 1.2rem;
    }

    .fa.fa-eye-slash {
      color: $gray;
      margin-left: 0.6rem;
    }

    .top-section {
      padding: 1.2rem;
      font-family: 'arconregular';

      &:hover {
        cursor: pointer;
        background-color: $gray-light;
      }

      .title {
        font-size: 1.5rem;

        a {
          color: $black;
        }
      }
      .name {
        font-size: 1.5rem;
      }
      .basename,
      .extension,
      .no-extension {
        display: inline-block;
      }
      .no-extension {
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: 800;
        color: $gray-dark;
        margin-left: 1em;
      }
      .description {
        font-style: italic;
        padding-bottom: 1.2rem;
      }

      ul.meta {
        list-style: none;
        padding: 0;
        font-size: 0.7rem;
        text-transform: uppercase;

        li {
          width: 250px;
          display: inline-block;

          &.not-audio {
            color: $gray-dark;
          }
        }
      }
      .uploaded-at {
        text-transform: uppercase;
      }

      &:hover {
        .controls {
          display: block;
        }
      }

      .visibility-icon {
        color: $gray;
        margin-left: 20px;
      }

      .controls {
        display: none;

        a {
          font-size: 1.4rem;
          color: $gray-dark;
          margin-left: 20px;

          &:hover {
            color: $pink;
          }
        }
      }

      @include media-breakpoint-up(md) {
        .controls {

        }
      }
    }

    .details-section {
      background-color: $gray-faint;
      height: 0;
      overflow: hidden;

      transition: height 100ms ease-out;
    }

    &.open {
      .details-section {
        height: 300px;
      }

      @include media-breakpoint-up(md) {
        .details-section {
          height: 100px;
        }
      }
    }
  }
</style>
