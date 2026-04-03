import React, { useState } from "react";

export type Item = {
  id: string;
  content: string;
};

// Custom MIME type used to identify drag payload, this avoids conflicts with other drag sources
const DND_TYPE = "application/x-item";

// Stores data in the drag event when dragging starts
export function setDragData(e: React.DragEvent, data: any) {
  // DataTransfer API ONLY supports strings
  const serialized = JSON.stringify(data);

  // Attach the serialized data to the drag event under our custom type
  // This data will travel with the drag operation until drop
  e.dataTransfer.setData(DND_TYPE, serialized);

  // Defines what operations are allowed for this drag
  // "move" means the item is expected to be removed from source and inserted into target
  // This mainly affects cursor feedback and UX expectations
  e.dataTransfer.effectAllowed = "move";
}

// Retrieves and parses the drag data during drop
export function getDragData<T>(e: React.DragEvent): T | null {
  // Attempt to read the data using the SAME type key used in setDragData
  // If the types don't match → returns empty string
  const raw = e.dataTransfer.getData(DND_TYPE);

  // If no data is found, it likely means:
  // - The drag did not originate from our app
  // - The type key is incorrect
  if (!raw) return null;

  try {
    // Parse the JSON string back into an object
    // This reconstructs the original payload passed in dragstart
    return JSON.parse(raw);
  } catch {
    // If parsing fails, return null instead of crashing the app
    // This protects against malformed or unexpected data
    return null;
  }
}

type DraggableItemProps = {
  item: Item;
  index: number;
  listId: string;
};

export function DraggableItem({ item, index, listId }: DraggableItemProps) {
  function handleDragStart(e: React.DragEvent) {
    setDragData(e, { item, index, fromList: listId });
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      // Removed the margin-bottom so the wrapper handles the spacing
      className="p-3 bg-white border border-gray-200 rounded shadow-sm cursor-grab active:cursor-grabbing"
    >
      {item.content}
    </div>
  );
}

// Updated data payload to include the original index
type MoveData = {
  item: Item;
  fromList: string;
  fromIndex: number;
  toList: string;
  toIndex: number;
};

type DropListProps = {
  listId: string;
  items: Item[];
  onMove: (data: MoveData) => void;
};

export function DropList({ listId, items, onMove }: DropListProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault(); // REQUIRED: enables dropping on this element

    setHoverIndex(index); // track where the item would be inserted (for UI feedback)

    e.dataTransfer.dropEffect = "move"; // hint that this is a move operation (affects cursor)
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault(); // prevent default browser behavior

    setHoverIndex(null); // clear hover state after drop

    // read serialized drag payload
    const data = getDragData<{
      item: Item;
      fromList: string;
      index: number;
    }>(e);

    if (!data) return; // ignore invalid/external drops

    // avoid unnecessary state updates (same position)
    if (data.fromList === listId && data.index === index) return;

    // trigger state update (move item)
    onMove({
      item: data.item,
      fromList: data.fromList,
      fromIndex: data.index,
      toList: listId,
      toIndex: index,
    });
  }

  function handleDragLeave() {
    setHoverIndex(null); // remove visual feedback when leaving drop zone
  }

  return (
    <div className="w-64 p-3 bg-gray-100 rounded min-h-[200px] flex flex-col gap-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragLeave={handleDragLeave}
          // Visual feedback showing where the item will land
          className={`transition-all duration-200 border-t-4 ${
            hoverIndex === index
              ? "border-blue-400 rounded-t"
              : "border-transparent"
          }`}
        >
          {/* DraggableItem is now rendered INSIDE the drop zone */}
          <DraggableItem item={item} index={index} listId={listId} />
        </div>
      ))}

      {/* Empty space at the bottom to allow appending to the list */}
      <div
        className={`flex-1 min-h-[60px] transition-all duration-200 border-t-4 ${
          hoverIndex === items.length
            ? "border-blue-400 rounded-t"
            : "border-transparent"
        }`}
        onDragOver={(e) => handleDragOver(e, items.length)}
        onDrop={(e) => handleDrop(e, items.length)}
        onDragLeave={handleDragLeave}
      />
    </div>
  );
}

type Lists = Record<string, Item[]>;

export default function DragAndDropDemo() {
  const [lists, setLists] = useState<Lists>({
    left: [
      { id: "1", content: "Item A" },
      { id: "2", content: "Item B" },
    ],
    right: [{ id: "3", content: "Item C" }],
  });

  function moveItem({ item, fromList, fromIndex, toList, toIndex }: MoveData) {
    setLists((prev) => {
      const next = { ...prev }; // shallow copy state object

      // 1. Remove item from source list
      next[fromList] = next[fromList].filter((i) => i.id !== item.id);

      // 2. Adjust index when reordering within same list (moving down shifts indices)
      let finalIndex = toIndex;
      if (fromList === toList && fromIndex < toIndex) {
        finalIndex -= 1;
      }

      // 3. Insert item into target list at computed position
      next[toList] = [...next[toList]]; // clone to avoid mutating original array
      next[toList].splice(finalIndex, 0, item);

      return next; // return new state
    });
  }

  return (
    <div className="flex gap-6 p-6">
      {Object.entries(lists).map(([listId, items]) => (
        <div key={listId}>
          <h2 className="mb-2 font-bold capitalize">{listId} List</h2>
          {/* We strictly delegate rendering items to DropList now */}
          <DropList listId={listId} items={items} onMove={moveItem} />
        </div>
      ))}
    </div>
  );
}
