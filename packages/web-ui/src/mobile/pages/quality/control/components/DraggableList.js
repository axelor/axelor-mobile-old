import React from "react";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import { Icon } from "react-onsenui";
import classNames from "classnames";
import { CardView } from "./../../../../components";
import { translate } from "../../../../locale";

const SortableItem = SortableElement(
  ({ value, renderControlPointView, edit, onDeleteContactPoint }) =>
    value && (
      <div
        className={classNames(edit ? "list-container-edit" : "list-container")}
        key={value.id}
      >
        <div
          style={{ display: "flex", flex: 1 }}
          onClick={e => {
            e.stopPropagation();
            renderControlPointView(value);
          }}
        >
          <div style={{ lineHeight: "5px" }}>
            <p style={{ fontWeight: "bold" }}>{value.name}</p>
          </div>
        </div>
        <div>
          {(value.statusSelect === 2 || value.status_select === 2) && (
            <CardView.TagButton
              style={{
                marginRight: 5,
                backgroundColor: "#E1AA46",
                fontStyle: "italic"
              }}
            >
              {translate("app.quality.done")}
            </CardView.TagButton>
          )}
        </div>
        <div>
          <Icon
            icon="fa-trash-o"
            className="item-nav-icon"
            style={{ fontSize: 20, marginLeft: 5 }}
            onClick={e => {
              e.stopPropagation();
              onDeleteContactPoint(value);
            }}
          />
        </div>
      </div>
    )
);

const sortByKey = (array, key) => {
  return array.sort(function(a, b) {
    let x = a[key];
    let y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
};

export const DraggableList = SortableContainer(
  ({ items, renderControlPointView, edit, onDeleteContactPoint }) => {
    const list = sortByKey(items, "sequence");
    return (
      <div>
        {list.map((value, index) => (
          <SortableItem
            key={`${value.id}_${Math.random()}`}
            index={index}
            value={value}
            renderControlPointView={renderControlPointView}
            onDeleteContactPoint={onDeleteContactPoint}
            edit={edit}
          />
        ))}
      </div>
    );
  }
);
