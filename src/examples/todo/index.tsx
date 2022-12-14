import {
  jsxFactory,
  createListSource,
  ListSource,
  List,
  useContext,
  If,
  Css,
  Lazy,
} from "@xania/view";

import classes from "./index.module.scss";

const jsx = jsxFactory({ classes });

export function TodoApp() {
  const newTodoText = new Lazy("");
  const items = createListSource<TodoItem>([
    {
      label: "hello",
      completed: true,
    },
    {
      label: "hi",
      completed: false,
    },
    {
      label: "hoi",
      completed: false,
    },
  ]);
  function onNewTodoKeyUp(e: JSX.EventContext<TodoItem, KeyboardEvent>) {
    const label = (e.event.target as any).value;
    if (e.event.key === "Enter" && label) {
      const newItem: TodoItem = {
        label,
        completed: false,
      };
      items.append([newItem]);
      newTodoText.select(e.data);
    }
  }

  return (
    <>
      <Css value="todoapp-container" />
      <section class="todoapp">
        <div>
          <header class="header">
            <h1>todos</h1>
            <input
              class="new-todo"
              placeholder="What needs to be done?"
              value={newTodoText}
              keyup={onNewTodoKeyUp}
            />
          </header>
          <TodoList items={items} />
          <If condition={items.map((l) => l.length > 0)}>
            <TodoFooter items={items} />
          </If>
        </div>
      </section>
    </>
  );
}

interface TodoListProps {
  items: ListSource<TodoItem>;
}

function TodoFooter(props: TodoListProps) {
  const { items } = props;

  function all(item: TodoItem) {
    return true;
  }

  function active(item: TodoItem) {
    return item.completed !== true;
  }

  function completed(item: TodoItem) {
    return item.completed === true;
  }

  return (
    <footer class="footer">
      <span class="todo-count">
        <strong>
          {items.map((l) => {
            const itemsLeft = l.filter((e) => !e.completed).length;
            return itemsLeft === 1 ? "1 item" : `${itemsLeft} items`;
          })}
        </strong>
        <span> left</span>
      </span>
      <ul class="filters">
        <li>
          <a class="selected" click={(_) => props.items.filter(all)}>
            All
          </a>
        </li>
        <span> </span>
        <li>
          <a click={(_) => props.items.filter(active)}>Active</a>
        </li>
        <span> </span>
        <li>
          <a click={(_) => props.items.filter(completed)}>Completed</a>
        </li>
      </ul>
    </footer>
  );
}

interface TodoListProps {
  items: ListSource<TodoItem>;
}

function TodoList(props: TodoListProps) {
  const row = useContext<TodoItem>();
  const editing = row.lazy("editing");

  let clearSelection: Function | null = null;
  function select(e: JSX.EventContext<TodoItem, Event>) {
    if (clearSelection instanceof Function) {
      clearSelection();
    }
    clearSelection = editing.select(e.data);
  }
  function setCompleted(e: JSX.EventContext<TodoItem, Event>) {
    const data = e.data;
    data.completed = (e.event.target as any).checked;
    props.items.update(() => [data]);
  }

  return (
    <ul class="todo-list">
      <List source={props.items}>
        <li
          class={[editing, row.map((x) => (x.completed ? "completed" : null))]}
        >
          <div class="view">
            <input
              class="toggle"
              type="checkbox"
              checked={row.get("completed")}
              change={setCompleted}
            />
            <label dblclick={select}>{row.get("label")}</label>
            <button
              class="destroy"
              click={(e) => props.items.delete(e.data)}
            ></button>
          </div>
          <input
            class="edit"
            value={row.get("label")}
            blur={(evnt) => {
              // evnt.node.value = evnt.data.get("label");
              clearSelection();
            }}
            keyup={(evnt: JSX.EventContext<TodoItem, KeyboardEvent>) => {
              if (evnt.event.key === "Enter") {
                const target = evnt.event.target as HTMLInputElement;
                evnt.data.label = target.value;
                props.items.updatePartial([evnt.data]);
                clearSelection();
              } else if (evnt.event.key === "Escape") {
                clearSelection();
              }
            }}
          >
            {editing.attach(focusInput)}
            {/* {$((_, { key, node }) =>
              currentEditing.pipe(
                Ro.filter((x) => x === key),
                Ro.map(() => focusInput(node as HTMLInputElement))
              )
            )} */}
          </input>
        </li>
      </List>
    </ul>
  );
}

interface TodoItem {
  label: string;
  completed: boolean;
}

function focusInput(e: JSX.ViewContext<TodoItem>) {
  const inputElt = e.node;
  inputElt.focus();
  inputElt.setSelectionRange(0, inputElt.value.length);
}
