-- Permitir que created_by sea nullable para torneos del sistema / seeding público inicial
alter table tournaments alter column created_by drop not null;
