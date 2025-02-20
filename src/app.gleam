import gleam/int
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import lustre/ui

pub type Model {
  Model(dummy: Nil, count: Int)
}

pub type Msg {
  UserIncrementedCount
  UserDecrementedCount
}

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

fn init(_flags) -> Model {
  Model(dummy: Nil, count: 0)
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    UserIncrementedCount -> Model(..model, count: model.count + 1)
    UserDecrementedCount ->
      case model.count == 0 {
        True -> Model(..model, count: 0)
        _ -> Model(..model, count: model.count - 1)
      }
  }
}

pub fn view(model: Model) -> element.Element(Msg) {
  let styles = [#("width", "100vw"), #("height", "100vh"), #("padding", "1rem")]
  let count = int.to_string(model.count)

  ui.centre(
    [attribute.style(styles)],
    ui.stack([], [
      ui.button([event.on_click(UserDecrementedCount)], [element.text("-")]),
      html.p([attribute.style([#("text-align", "center")])], [
        element.text(count),
      ]),
      ui.button([event.on_click(UserIncrementedCount)], [element.text("+")]),
    ]),
  )
}
