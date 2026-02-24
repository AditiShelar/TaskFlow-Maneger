package com.Assigment.Task.service;

import com.Assigment.Task.Entity.TaskEntry;
import com.Assigment.Task.Entity.User;
import com.Assigment.Task.Repository.TaskEntryRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class TaskEntryService {

    @Autowired
    private TaskEntryRepository taskEntryRepo;

    @Autowired
    private UserService userService;

    /**
     * Create a NEW task and link it to the user's task list.
     */
    public TaskEntry saveEntry(TaskEntry myEntry, ObjectId userId) {
        User user = userService.findById(userId);
        TaskEntry saved = taskEntryRepo.save(myEntry);

        if (user.getTaskEntries() == null) {
            user.setTaskEntries(new java.util.ArrayList<>());
        }
        user.getTaskEntries().add(saved);
        userService.save(user);

        return saved;
    }

    /**
     * Update an EXISTING task — only saves to the task collection,
     * does NOT re-add it to the user's list (it's already there).
     */
    public TaskEntry updateEntry(TaskEntry entry) {
        return taskEntryRepo.save(entry);
    }

    public List<TaskEntry> findAll() {
        return taskEntryRepo.findAll();
    }

    public Optional<TaskEntry> findById(ObjectId myId) {
        return taskEntryRepo.findById(myId);
    }

    public void deleteById(ObjectId id, ObjectId userId) {
        User user = userService.findById(userId);
        user.getTaskEntries().removeIf(x -> x.getId().equals(id));
        userService.save(user);

        taskEntryRepo.deleteById(id);
    }
}
