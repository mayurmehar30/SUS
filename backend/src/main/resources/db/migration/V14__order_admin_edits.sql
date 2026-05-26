CREATE TABLE order_admin_edits (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT NOT NULL REFERENCES orders(id),
    edited_by   VARCHAR(255) NOT NULL,
    edited_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    summary     TEXT
);

CREATE INDEX idx_order_admin_edits_order_id ON order_admin_edits(order_id);
