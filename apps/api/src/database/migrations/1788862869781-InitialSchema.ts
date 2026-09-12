import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788862869781 implements MigrationInterface {
  name = 'InitialSchema1788862869781';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "kini_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying(255), "googleId" character varying(255), "avatarUrl" character varying(255), "givenName" character varying(255), "familyName" character varying(255), "textColor" character varying(255) NOT NULL DEFAULT '#000000', "backgroundColor" character varying(255) NOT NULL DEFAULT '#FFFFFF', "notificationsEnabled" boolean NOT NULL DEFAULT true, "language" character varying(16), "theme" character varying(16), "active_team_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7f642cff40488d8caf8ad71b76c" UNIQUE ("email"), CONSTRAINT "UQ_54e3da81a2c235a49b939367649" UNIQUE ("googleId"), CONSTRAINT "PK_076fc273ea2610a1d4a9429c790" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_email" ON "kini_user"  ("email") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_google_id" ON "kini_user"  ("googleId") `
    );
    await queryRunner.query(
      `CREATE TABLE "fut_pool_match" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "home_team" character varying(255) NOT NULL, "away_team" character varying(255) NOT NULL, "pool_order" integer NOT NULL, "results" character array NOT NULL DEFAULT '{}', "official_results" character array NOT NULL DEFAULT '{}', "success" boolean, "elige8" boolean NOT NULL DEFAULT false, "full15" boolean NOT NULL DEFAULT false, "fut_pool_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_36da98b9e95647a292b35f66cd9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "team_membership" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "team_id" uuid NOT NULL, "user_id" uuid, "invited_email" character varying(255) NOT NULL, "role" character varying(16) NOT NULL DEFAULT 'member', "status" character varying(16) NOT NULL DEFAULT 'pending', "invited_by_id" uuid, "joined_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b4f8962cc9081c5d30e78cecefc" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_team_membership_invited_email" ON "team_membership"  ("team_id", "invited_email") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_team_membership_user" ON "team_membership"  ("team_id", "user_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "team" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "owner_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f57d8293406df4af348402e4b74" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "fut_pool" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255), "doubles" integer NOT NULL, "triples" integer NOT NULL DEFAULT '0', "elige8" boolean NOT NULL DEFAULT false, "date" date NOT NULL, "active" boolean NOT NULL DEFAULT false, "cost" double precision, "earning" double precision, "team_id" uuid, "available_pool_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_61854ec7cdffe5a04fd9e8659aa" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "available_pool" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" character varying(80) NOT NULL DEFAULT 'eduardo-losilla', "game_type" character varying(80) NOT NULL, "external_draw_id" character varying(160) NOT NULL, "name" character varying(255) NOT NULL, "draw_date" date NOT NULL, "closing_date" TIMESTAMP WITH TIME ZONE, "status" character varying(40) NOT NULL DEFAULT 'SCHEDULED', "jackpot" character varying(80), "jackpot_formatted" character varying(120), "matches" jsonb NOT NULL DEFAULT '[]'::jsonb, "raw_payload" jsonb, "last_synced_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3def9faf4c5a3bab1646e9006a7" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_226899ce08545d3b1c90022a1b" ON "available_pool"  ("provider", "game_type", "external_draw_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "fut_pool_match" ADD CONSTRAINT "FK_dfe7613275d59bff488944d3514" FOREIGN KEY ("user_id") REFERENCES "kini_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "fut_pool_match" ADD CONSTRAINT "FK_2c2a3e72a98ad778c29ca899aed" FOREIGN KEY ("fut_pool_id") REFERENCES "fut_pool"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "team_membership" ADD CONSTRAINT "FK_91c8aa3bf9a3a7a3918fcea43a0" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "team_membership" ADD CONSTRAINT "FK_59a1695bd2bff4ea225cc211dac" FOREIGN KEY ("user_id") REFERENCES "kini_user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "team" ADD CONSTRAINT "FK_a5111ebcad0cc858f6527f1f60a" FOREIGN KEY ("owner_id") REFERENCES "kini_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "fut_pool" ADD CONSTRAINT "FK_aec6a468ccea7396108c37582c5" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "fut_pool" ADD CONSTRAINT "FK_3fc1a3d193ec85aaf52705b2514" FOREIGN KEY ("available_pool_id") REFERENCES "available_pool"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fut_pool" DROP CONSTRAINT "FK_3fc1a3d193ec85aaf52705b2514"`
    );
    await queryRunner.query(
      `ALTER TABLE "fut_pool" DROP CONSTRAINT "FK_aec6a468ccea7396108c37582c5"`
    );
    await queryRunner.query(`ALTER TABLE "team" DROP CONSTRAINT "FK_a5111ebcad0cc858f6527f1f60a"`);
    await queryRunner.query(
      `ALTER TABLE "team_membership" DROP CONSTRAINT "FK_59a1695bd2bff4ea225cc211dac"`
    );
    await queryRunner.query(
      `ALTER TABLE "team_membership" DROP CONSTRAINT "FK_91c8aa3bf9a3a7a3918fcea43a0"`
    );
    await queryRunner.query(
      `ALTER TABLE "fut_pool_match" DROP CONSTRAINT "FK_2c2a3e72a98ad778c29ca899aed"`
    );
    await queryRunner.query(
      `ALTER TABLE "fut_pool_match" DROP CONSTRAINT "FK_dfe7613275d59bff488944d3514"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_226899ce08545d3b1c90022a1b"`);
    await queryRunner.query(`DROP TABLE "available_pool"`);
    await queryRunner.query(`DROP TABLE "fut_pool"`);
    await queryRunner.query(`DROP TABLE "team"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_team_membership_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_team_membership_invited_email"`);
    await queryRunner.query(`DROP TABLE "team_membership"`);
    await queryRunner.query(`DROP TABLE "fut_pool_match"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_google_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_email"`);
    await queryRunner.query(`DROP TABLE "kini_user"`);
  }
}
