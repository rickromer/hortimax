CREATE TABLE `catalogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('zone','clientType','noteCategory') NOT NULL,
	`value` varchar(120) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `catalogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checkins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`userId` int NOT NULL,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`distanceMeters` int,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`userId` int NOT NULL,
	`checkinId` int,
	`category` varchar(80),
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`clientType` varchar(80),
	`zone` varchar(120),
	`description` text,
	`contactName` varchar(160),
	`phone` varchar(40),
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`accuracy` int,
	`address` text,
	`createdBy` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `mustChangePassword` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `activationCode` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(40);--> statement-breakpoint
ALTER TABLE `users` ADD `zone` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
CREATE INDEX `catalogs_kind_idx` ON `catalogs` (`kind`);--> statement-breakpoint
CREATE INDEX `checkins_site_idx` ON `checkins` (`siteId`);--> statement-breakpoint
CREATE INDEX `checkins_user_idx` ON `checkins` (`userId`);--> statement-breakpoint
CREATE INDEX `notes_site_idx` ON `notes` (`siteId`);--> statement-breakpoint
CREATE INDEX `notes_user_idx` ON `notes` (`userId`);--> statement-breakpoint
CREATE INDEX `sites_createdBy_idx` ON `sites` (`createdBy`);--> statement-breakpoint
CREATE INDEX `sites_zone_idx` ON `sites` (`zone`);