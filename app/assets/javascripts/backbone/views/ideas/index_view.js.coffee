Linus.Views.Ideas ||= {}

class Linus.Views.Ideas.IndexView extends Backbone.View
  template: JST["backbone/templates/ideas/index"]

  initialize: () ->
        @options.ideas.on('reset', @addAll)
        @options.ideas.on('sync', @render)

  addAll: () =>
    @options.ideas.each(@addOne)

  addOne: (idea) =>
    view = new Linus.Views.Ideas.IdeaView({model : idea})
    @$("#ideas-list").prepend(view.render().el)

  render: =>
    $(@el).html(@template(ideas: @options.ideas.toJSON() ))
    @addAll()
    return this
