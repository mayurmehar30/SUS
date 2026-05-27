-- V21: Clear all order data for a fresh start.

TRUNCATE TABLE
  delivery_tracking,
  payments,
  production_tracking,
  order_admin_edits,
  order_count_history,
  class_student_counts,
  order_items,
  orders
RESTART IDENTITY CASCADE;
