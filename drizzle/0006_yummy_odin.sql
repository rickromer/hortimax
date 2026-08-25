ALTER TABLE `sites` ADD `department` varchar(120);--> statement-breakpoint
CREATE INDEX `sites_department_idx` ON `sites` (`department`);