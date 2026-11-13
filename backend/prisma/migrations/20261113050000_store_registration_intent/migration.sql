CREATE TYPE "StoreRegistrationIntent" AS ENUM('BUY_FROM_STORE','SELL_TO_STORE','BOTH');
ALTER TABLE "User" ADD COLUMN "storeIntent" "StoreRegistrationIntent" NOT NULL DEFAULT 'BUY_FROM_STORE';
